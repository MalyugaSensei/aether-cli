import type { SourceFile } from "ts-morph";
import { SyntaxKind } from "ts-morph";
import { AST_SYMBOL } from "./constants.js";

export function addNamedImportIfMissing(
  sf: SourceFile,
  moduleSpecifier: string,
  namedImports: string[],
): void {
  const existing = sf.getImportDeclaration(
    (d) => d.getModuleSpecifierValue() === moduleSpecifier,
  );

  if (!existing) {
    sf.addImportDeclaration({
      moduleSpecifier,
      namedImports: namedImports.map((name) => ({ name })),
    });
    return;
  }

  for (const name of namedImports) {
    const has = existing.getNamedImports().some((ni) => ni.getName() === name);
    if (!has) {
      existing.addNamedImport(name);
    }
  }
}

function findVariableArrayLiteral(
  sf: SourceFile,
  variableName: string,
): import("ts-morph").ArrayLiteralExpression | undefined {
  for (const decl of sf.getVariableDeclarations()) {
    if (decl.getName() !== variableName) continue;
    const init = decl.getInitializer();
    if (!init || !init.isKind(SyntaxKind.ArrayLiteralExpression)) continue;
    return init.asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
  }
  return undefined;
}

function spreadContainsIdentifier(
  element: import("ts-morph").Expression,
  identifier: string,
): boolean {
  if (element.isKind(SyntaxKind.SpreadElement)) {
    const expr = element.asKindOrThrow(SyntaxKind.SpreadElement).getExpression();
    if (expr.isKind(SyntaxKind.Identifier) && expr.getText() === identifier) {
      return true;
    }
  }
  return false;
}

function arrayContainsIdentifier(
  arr: import("ts-morph").ArrayLiteralExpression,
  identifier: string,
): boolean {
  return arr.getElements().some((el) => {
    if (el.isKind(SyntaxKind.Identifier) && el.getText() === identifier) {
      return true;
    }
    return spreadContainsIdentifier(el, identifier);
  });
}

/** Append identifier to `const <arrayName> = [...]` if not already present. */
export function appendToArrayLiteralIfMissing(
  sf: SourceFile,
  arrayVariableName: string,
  elementIdentifier: string,
  asSpread = false,
): void {
  const arr = findVariableArrayLiteral(sf, arrayVariableName);
  if (!arr) {
    throw new Error(
      `Could not find array variable "${arrayVariableName}" in ${sf.getFilePath()}`,
    );
  }
  if (arrayContainsIdentifier(arr, elementIdentifier)) {
    return;
  }
  if (asSpread) {
    arr.addElement(`...${elementIdentifier}`);
  } else {
    arr.addElement(elementIdentifier);
  }
}

/** Insert identifier before `beforeIdentifier` in `const <arrayName> = [...]` if not already present. */
export function insertIntoArrayLiteralBeforeIfMissing(
  sf: SourceFile,
  arrayVariableName: string,
  beforeIdentifier: string,
  elementIdentifier: string,
): void {
  const arr = findVariableArrayLiteral(sf, arrayVariableName);
  if (!arr) {
    throw new Error(
      `Could not find array variable "${arrayVariableName}" in ${sf.getFilePath()}`,
    );
  }
  if (arrayContainsIdentifier(arr, elementIdentifier)) {
    return;
  }
  const elements = arr.getElements();
  const beforeIndex = elements.findIndex(
    (el) => el.isKind(SyntaxKind.Identifier) && el.getText() === beforeIdentifier,
  );
  if (beforeIndex === -1) {
    throw new Error(
      `Could not find element "${beforeIdentifier}" in array "${arrayVariableName}" in ${sf.getFilePath()}`,
    );
  }
  arr.insertElement(beforeIndex, elementIdentifier);
}

function findBuildAppRoutesReturnArray(
  sf: SourceFile,
): import("ts-morph").ArrayLiteralExpression | undefined {
  const fn = sf.getFunction(AST_SYMBOL.buildAppRoutes);
  if (!fn) {
    return undefined;
  }
  for (const ret of fn.getDescendantsOfKind(SyntaxKind.ReturnStatement)) {
    const expr = ret.getExpression();
    if (expr?.isKind(SyntaxKind.ArrayLiteralExpression)) {
      return expr;
    }
  }
  return undefined;
}

/** Append `...createFooModule({}).routes` to `buildAppRoutes()` return array if missing. */
export function appendModuleRoutesSpreadIfMissing(
  sf: SourceFile,
  moduleFactory: string,
  moduleCallArgs: string,
): void {
  const arr = findBuildAppRoutesReturnArray(sf);
  if (!arr) {
    throw new Error(
      `Could not find ${AST_SYMBOL.buildAppRoutes}() return array in ${sf.getFilePath()}`,
    );
  }
  const marker = `${moduleFactory}(`;
  for (const el of arr.getElements()) {
    if (el.getText().includes(marker)) {
      return;
    }
  }
  arr.addElement(`...${moduleFactory}(${moduleCallArgs}).routes`);
}
