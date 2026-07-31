# Figma Vertical Roll Chassis Audit

Source frame: `Step 01-Vertical Roll`  
Figma node: `358:8374`  
File: `SFDW 2026` (`6mgzLDLMGz0kLU908YXSiZ`)  
Audit date: 2026-06-05

## Root Frame

- Frame size: `1440 x 1024`
- Frame fill: `#e3e3e3`
- Clips content: `true`

## Vertical Roll Container

- Node: `358:8548`, `Vertical Roll`
- Position: `x=349`, `y=271`
- Size: `742 x 481`
- Container itself has no fill, no stroke, no corner radius.
- Base visible shell is child rectangle `358:8549`.

## Base Shell

- Node: `358:8549`, `Rectangle 6115`
- Position within vertical roll: `x=0`, `y=0`
- Size: `742 x 481`
- Fill: `#ffffff`
- Stroke: `#000000`, inside, `1px`
- Radius: `11px` on all corners

## Chrome Divider Bands

The divider bands are separate 21px line rectangles plus 16px grey rectangles. They should not be approximated as a single 37px border box.

- Top group `358:8558`
  - line rectangle: `x=0`, `y=0`, `w=742`, `h=21`, bottom stroke only `1px`
  - grey rectangle: `x=0.886`, `y=21`, `w=740.225`, `h=16`, fill `#d9d9d9`
- Middle group `358:8555`
  - line rectangle: `x=0`, `y=154`, `w=742`, `h=21`, top and bottom strokes `1px`
  - grey rectangle: `x=1`, `y=175`, `w=740`, `h=16`, fill `#d9d9d9`
- Bottom group `358:8552`
  - line rectangle: `x=0`, `y=306`, `w=742`, `h=21`, top and bottom strokes `1px`
  - grey rectangle: `x=1.157`, `y=327`, `w=739.685`, `h=16`, fill `#d9d9d9`
- Bottom floor line `358:8551`
  - position: `x=0`, `y=459`, `w=742`, `h=22`
  - stroke: top only `1px`

## Card Row Window

- Node: `358:8561`, `Frame 10177`
- Position: `x=38`, `y=25`
- Size: `665 x 431`
- In this Figma chassis frame the card layer is hidden. In the live app, this same geometry is reused with live cards visible.

## Top Shader Overlay

- Group: `358:8580`, `Group 10173`
- Position: `x=1`, `y=1`
- Size: `740 x 479`
- Fill comes from two child rectangles, both `#d4d4d4` at `81%` opacity.

Top shader:

- Node: `358:8582`, `Rectangle 6117`
- Visual position: `x=1`, `y=1`, `w=740`, `h=173`
- Figma transform: vertical flip (`scaleY=-1`)
- Source radius is bottom-left/bottom-right `10px`, but after flip the visual radius is top-left/top-right `10px`.

Bottom shader:

- Node: `358:8581`, `Rectangle 6118`
- Position: `x=1`, `y=307`, `w=740`, `h=173`
- Radius: bottom-left/bottom-right `10px`

## Webapp Fixes Applied

- Replaced gradient-based chrome bands with exact pseudo-element layers.
- Added the missing bottom floor line at `y=459`.
- Corrected shader positions and heights to `top=1/307`, `height=173`.
- Corrected the top shader visual radius to top corners instead of bottom corners.
- Preserved the live card layer above chrome and below shader.

## Follow-Up Structure Alignment

Source section: `machine structure`  
Figma node: `358:8775`

The section breaks the machine into three frames:

- `01 frame` (`358:8374`): colorless frame structure.
- `02 with shade` (`358:8703`): adds the grey chrome strips.
- `03 with windows` (`358:8739`): final target, adding the two semi-transparent shade windows.

Important correction:

- In Figma, `Vertical Roll` (`358:8740`) is only a coordinate container: no fill, no stroke, no radius, no clipping.
- The visible white rounded shell is a child rectangle (`358:8741`) at `x=0`, `y=0`, `w=742`, `h=481`, radius `11`, inside stroke `1`.
- Therefore the webapp must not put the border directly on `.vertical-roll`; doing so shifts absolute-positioned child layers inward relative to Figma.
- The webapp now uses `.vertical-roll::before` as the shell rectangle, leaving `.vertical-roll` as a clean coordinate container.

Live alignment values after the correction:

- Shell layer: `0,0,742,481`, radius `11`, border `1`
- Chrome groups: `top=0`, `154`, `306`
- Bottom floor line: `top=459`, `height=22`
- Card window: `left=38`, `top=25`, `width=665`, `height=431`
- Top shade window: `left=1`, `top=1`, `width=740`, `height=173`
- Bottom shade window: `left=1`, `top=307`, `width=740`, `height=173`

## Divider Stroke Visibility

The three bottom divider strokes are at:

- `y=21`: covered by the top shade window, so it should render faintly.
- `y=175`: outside both shade windows, so it should render fully exposed.
- `y=327`: covered by the bottom shade window, so it should render faintly.

Implementation note:

- The chrome pseudo-elements must use `box-sizing: border-box`.
- Without this, the `1px` bottom stroke is painted at the same y-position as the following grey strip and gets covered by that grey strip.
- Layer order should remain: shell rectangle, chrome dividers, card window, shade windows.
