import { ViewTransition } from "react";

const directional = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

/**
 * Slides page content left or right when a <Link> navigation is tagged with
 * transitionTypes={["nav-forward"]} or ["nav-back"]. Untagged navigations don't animate.
 * Belongs in page.tsx, not a layout: layouts persist, so enter/exit never fire there.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={directional} exit={directional} default="none">
      {children}
    </ViewTransition>
  );
}
