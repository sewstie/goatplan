// The app has one focus ring (see :focus-visible in globals.css). These draw the same ring on a
// box whose real control sits inside it, like a text field or a hidden checkbox.

export const focusWithin = "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus";

/** For rows in a list, where a ring outside the edge would be cut off. */
export const focusWithinInset = "has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-focus";

export const peerFocus = "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";
