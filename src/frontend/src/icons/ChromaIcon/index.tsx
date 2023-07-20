import React, { forwardRef } from "react";
import SvgChroma from "./Chroma";

export const ChromaIcon = forwardRef<
  SVGSVGElement,
  React.PropsWithChildren<{}>
>((props, ref) => {
  return <SvgChroma ref={ref} {...props} />;
});
