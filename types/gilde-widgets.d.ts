import type React from "react";

// The GildeConnect widgets are framework-agnostic custom elements loaded from
// connect.gilde.org. Declare them so TSX accepts arbitrary string attributes.
type GildeWidgetProps = React.HTMLAttributes<HTMLElement> & Record<string, unknown>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "gilde-contact": GildeWidgetProps;
      "gilde-support": GildeWidgetProps;
    }
  }
}
