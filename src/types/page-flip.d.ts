// page-flip(StPageFlip) 2.x — 이 프로젝트에서 쓰는 부분만 선언 (패키지에 타입이 없음)
declare module "page-flip" {
  type FlipState = "user_fold" | "fold_corner" | "flipping" | "read";

  export interface FlipSettings {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    showCover?: boolean;
    usePortrait?: boolean;
    flippingTime?: number;
    drawShadow?: boolean;
    maxShadowOpacity?: number;
    showPageCorners?: boolean;
    mobileScrollSupport?: boolean;
    useMouseEvents?: boolean;
    disableFlipByClick?: boolean;
    startPage?: number;
    autoSize?: boolean;
    swipeDistance?: number;
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: FlipSettings);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getState(): FlipState;
    on(event: "flip", callback: (e: { data: number }) => void): this;
    on(event: "changeState", callback: (e: { data: FlipState }) => void): this;
    on(event: "init", callback: (e: { data: { page: number } }) => void): this;
    destroy(): void;
  }
}
