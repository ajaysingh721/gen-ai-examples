/// <reference types="jest" />

import "@testing-library/jest-dom";

import * as React from "react";

// Next.js Link isn't necessary for unit tests; render as a plain anchor.
jest.mock("next/link", () => {
  return function Link({ href, children, ...props }: any) {
    const resolvedHref = typeof href === "string" ? href : href?.pathname;
    return React.createElement("a", { href: resolvedHref, ...props }, children);
  };
});
