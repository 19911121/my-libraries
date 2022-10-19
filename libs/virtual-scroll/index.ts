/**
 * 가상 스크롤
 */
type Row<T = unknown> = T;
type UpdateRowReturnType = {
  rendered: () => void;
};

type ScrollCallBack = (e: Event) => void;

interface Options<R> {
  rows?: Row<R>[];
  bench: number;
  direction: 'vertical' | 'horizontal';
}

class FBVirtualScroll<R = unknown> {
  private options: Options<R>;
  private rows: Row<R>[] = [];

  /**
   * 렌더링 할 Rows
   */
  private renderRows: Row<R>[] = [];
  private renderFirstRowIndex = 0;
  private renderLastRowIndex = 0;

  /**
   * Row 에 대한 Rect 정보를 담고있는 배열
   */
  private rowRects: DOMRect[] = [];

  // #region container
  /**
   * 가상스크롤을 적용 할 container
   */
  private refContainer: HTMLElement;

  /**
   * continaer Rect
   */
  private containerRect: DOMRect = new DOMRect();
  // #endregion

  // #region wrapper
  /**
   * 가상스크롤을 적용 할 wrapper
   */
  private refWrapper: HTMLElement;
  private wrapperWidth = 0;
  private wrapperPaddingLeft = 0;
  private wrapperHeight = 0;
  private wrapperPaddingTop = 0;
  // #endregion

  // #region etc
  /**
   * 보정 스크롤
   */
  private calibrationScroll = 0;

  /**
   * 가로 세로 적용 좌표
   * 가로 left, right
   * 세로 top, bottom
   */
  private referenceCoordinates: ('top' | 'right' | 'bottom' | 'left')[];

  //
  private bindHandleContainerScroll = this.handleContainerScroll.bind(this);

  /**
   * scroll callback
   */
  private callback: ScrollCallBack | null = null;
  // #endregion

  constructor(container: HTMLElement, wrapper: HTMLElement, options?: Partial<Options<R>>) {
    this.refContainer = container;
    this.refWrapper = wrapper;
    this.options = {
      bench: options?.bench ?? 0,
      direction: options?.direction ?? 'vertical',
    };
    this.rows = options?.rows ?? [];

    if ('horizontal' === this.options.direction) this.referenceCoordinates = ['left', 'right'];
    else this.referenceCoordinates = ['top', 'bottom'];

    this.initDynamicRows();
    this.initContainer();
    this.initRenderRows();
  }

  // #region 공통
  /**
   * 세로 스크롤 존재여부 반환
   */
  private hasHorizontalScroll() {
    return this.wrapperWidth > this.getContainerWidth();
  }

  /**
   * 세로 스크롤 존재여부 반환
   */
  private hasVerticalScroll() {
    return this.wrapperHeight > this.getContainerHeight();
  }
  // #endregion

  // #region container
  /**
   * container 초기화
   */
  private initContainer(): void {
    this.removeContainerEvent();
    this.addContainerEvent();
    this.containerRect = this.refContainer.getBoundingClientRect();
    this.calibrationScroll = this.refContainer.scrollTop - this.wrapperPaddingTop;
  }

  /**
   * container 이벤트 등록
   */
  private addContainerEvent(): void {
    this.refContainer.addEventListener('scroll', this.bindHandleContainerScroll);
  }

  /**
   * container 이벤트 제거
   */
  private removeContainerEvent(): void {
    this.refContainer.removeEventListener('scroll', this.bindHandleContainerScroll);
  }

  /**
   * container 상하 여백 반환
   */
  public getContainerPaddingVertical(): number {
    const styles = window.getComputedStyle(this.refContainer);
    const verticalPadding = Number.parseFloat(styles['paddingTop']) + Number.parseFloat(styles['paddingBottom']);

    return verticalPadding;
  }

  /**
   * container 상단 여백
   */
  public getContainerPaddingTop(): number {
    const styles = window.getComputedStyle(this.refContainer);
    const paddingTop = Number.parseFloat(styles['paddingTop']);

    return paddingTop;
  }

  /**
   * container 하단 여백
   */
  public getContainerPaddingBottom(): number {
    const styles = window.getComputedStyle(this.refContainer);
    const paddingBottom = Number.parseFloat(styles['paddingBottom']);

    return paddingBottom;
  }

  /**
   * container 높이 반환
   */
  public getContainerHeight(): number {
    return this.refContainer.offsetHeight;
  }

  /**
   * container 넓이 반환
   */
  public getContainerWidth(): number {
    return this.refContainer.offsetWidth;
  }
  // #endregion

  // #region wrapper
  /**
   * wrapper 상단 여백 반환
   */
  public getWrapperMarginTop(): number {
    const styles = window.getComputedStyle(this.refWrapper);
    const verticalMarginTop = Number.parseFloat(styles['marginTop']);

    return verticalMarginTop;
  }

  /**
   * wrapper 하단 여백 반환
   */
  public getWrapperMarginVertical(): number {
    const styles = window.getComputedStyle(this.refWrapper);
    const verticalMarginBottom = Number.parseFloat(styles['marginBottom']);

    return verticalMarginBottom;
  }

  /**
   * wrapper 스타일
   */
  public getWrapperStyle(): Partial<Omit<CSSStyleDeclaration, 'parentRule' | 'length'>> {
    if ('horizontal' === this.options.direction) {
      if (this.hasHorizontalScroll()) {
        return {
          transform: `translateX(${this.wrapperPaddingLeft}px)`,
          width: `${this.wrapperWidth}px`,
        };
      }

      return {};
    }
    else {
      if (this.hasVerticalScroll()) {
        return {
          transform: `translateY(${this.wrapperPaddingTop}px)`,
          height: `${this.wrapperHeight - this.wrapperPaddingTop}px`,
        };
      }

      return {};
    }
  }
  // #endregion

  // #region rows
  /**
   * 화면에 표시할 Rows 초기화
   */
  private initRenderRows(): void {
    this.rowRects = Array.from(this.refWrapper.children).map((v) => v.getBoundingClientRect());
    this.wrapperWidth = this.refWrapper.offsetWidth;
    this.wrapperHeight = this.refWrapper.offsetHeight;
    this.execVerticalScroll(this.refContainer.scrollTop);

    if (this.hasVerticalScroll()) this.wrapperHeight += this.getContainerPaddingVertical();
  }

  /**
   * rendering 할 rows
   */
  public getRenderRows(): R[] {
    return this.renderRows;
  }

  /**
   * 그려질 첫번째 row index 반환
   */
  public getRenderFirstRowIndex(): number {
    return this.renderFirstRowIndex;
  }

  /**
   * 그려질 마지막 row index 반환
   */
  public getRenderLastRowIndex(): number {
    return this.renderLastRowIndex;
  }

  /**
   * 화면에 표시 할 첫번째 row
   * @param scroll
   */
  private getFirstRow(scroll: number): number {
    const [refFirstCoordinate, refLastCoordinate] = this.referenceCoordinates;
    const firstRow = this.rowRects.findIndex((v) => {
      return scroll <= v[refLastCoordinate] - this.containerRect[refFirstCoordinate] + this.calibrationScroll;
    });

    return Math.max(0, firstRow);
  }

  /**
   * 화면에 표시 할 첫번쨰 bench row
   */
  private getFirstBenchRow(firstRow: number): number {
    return Math.max(0, firstRow - this.options.bench);
  }

  /**
   * 화면에 표시 할 bench rows
   */
  private getBeforeBenchRows(firstRow: number): DOMRect[] {
    return this.rowRects.slice(Math.max(0, firstRow - this.options.bench), firstRow);
  }

  /**
   * 화면에 표시 할 bench rows width 합
   * @param firstRow
   */
  private getBeforeBenchWidth(firstRow: number): number {
    const [refFirstCoordinate, refLastCoordinate] = this.referenceCoordinates;
    const beforeBenchRows = this.getBeforeBenchRows(firstRow);

    return beforeBenchRows.length ? beforeBenchRows.slice(-1)[0][refLastCoordinate] - beforeBenchRows[0][refFirstCoordinate] : 0;
  }

  /**
   * 화면에 표시 할 bench rows height 합
   *
   * @param firstRow
   */
  private getBeforeBenchHeight(scroll: number, firstRow: number): number {
    const [refFirstCoordinate, refLastCoordinate] = this.referenceCoordinates;
    const beforeBenchRows = this.getBeforeBenchRows(firstRow);
    const firstRowHideHeight = this.rowRects[firstRow][refFirstCoordinate] - this.containerRect[refFirstCoordinate] - scroll + this.calibrationScroll - this.getWrapperMarginTop();

    return beforeBenchRows.length ? beforeBenchRows.slice(-1)[0][refLastCoordinate] - beforeBenchRows[0][refFirstCoordinate] - firstRowHideHeight : -firstRowHideHeight;
  }

  /**
   * 화면에 표시 할 마지막 row
   *
   * @param scroll 현재 스크롤위치
   * @param fr 첫번째 row
   */
  private getLastRow(scroll: number, fr?: number): number {
    const containerSize = 'horizontal' === this.options.direction ? this.getContainerWidth() : this.getContainerHeight();
    const [refFirstCoordinate] = this.referenceCoordinates;
    const firstRow = fr ?? this.getFirstRow(scroll);
    let lastRow = this.rowRects.slice(firstRow, this.rows.length).findIndex((v) => {
      return scroll + containerSize <= v[refFirstCoordinate] - this.containerRect[refFirstCoordinate] + this.calibrationScroll;
    });

    lastRow = -1 === lastRow ? this.rows.length : firstRow + lastRow;
    lastRow += +this.options.bench;

    return Math.min(this.rows.length, lastRow);
  }

  /**
   * 화면에 표시할 Rows 추가
   * @param children
   */
  public addRenderRows(children: HTMLCollection, height: number): void {
    this.wrapperHeight += height;
    this.rowRects = this.rowRects.concat(Array.from(children).map((v) => {
      const rect = v.getBoundingClientRect();

      return {
        ...rect,
        
        top: this.wrapperHeight += rect.top,
        bottom: this.wrapperHeight += rect.bottom,
      };
    }));
    this.execVerticalScroll(this.refContainer.scrollTop);

    if (this.hasVerticalScroll()) this.wrapperHeight += this.getContainerPaddingVertical();
  }

  /**
   * rows 정보가 업데이트 될 시 호출
   */
  public updateRows(rows: Row<R>[]): UpdateRowReturnType {
    this.rows = rows;

    return {
      /**
       * rows 업데이트 후
       * 사용자 페이지에서 렌더링 완료 시 호출이 필요합니다.
       */
      rendered: () => {
        this.initDynamicRows();
        this.initContainer();
        this.initRenderRows();
      },
    };
  }

  /**
   * 화면에 표시 할 마지막 bench row
   */
  private getLastBenchRow(lastRow: number): number {
    return Math.min(this.rows.length, lastRow + this.options.bench);
  }

  /**
   * 가상스크롤 실행(세로)
   *
   * @param scrollTop 이동 할 top 좌표
   */
  private execVerticalScroll(scrollTop: number) {
    const firstRow = this.getFirstRow(scrollTop);
    const firstBenchRow = this.getFirstBenchRow(firstRow);
    const lastRow = this.getLastRow(scrollTop, firstRow);
    const lastBenchRow = this.getLastBenchRow(lastRow);
    const beforeRowsHeight = this.getBeforeBenchHeight(scrollTop, firstRow);

    this.renderFirstRowIndex = firstBenchRow;
    this.renderLastRowIndex = lastBenchRow;
    this.renderRows = this.rows.slice(firstBenchRow, lastBenchRow);
    this.wrapperPaddingTop = scrollTop - beforeRowsHeight - this.getContainerPaddingBottom() / 2;
  }

  /**
   * Row가 있는 위치로 스크롤 이동
   *
   * @param row 이동 할 row
   */
  public moveVerticalScrollToRow(row: number) {
    const [refFirstCoordinate] = this.referenceCoordinates;
    const rect = this.rowRects[row];
    const scrollTop = rect[refFirstCoordinate] - this.containerRect[refFirstCoordinate] + this.calibrationScroll;

    this.refContainer.scrollTo(this.refContainer.scrollLeft, scrollTop);
  }

  /**
   * 가로 스크롤에 따른 가상스크롤 실행
   */
  private execHorizontalScroll(scrollLeft: number): void {
    const firstRow = this.getFirstRow(scrollLeft);
    const firstBenchRow = this.getFirstBenchRow(firstRow);
    const lastRow = this.getLastRow(scrollLeft, firstRow);
    const lastBenchRow = this.getLastBenchRow(lastRow);
    const beforeRowsWidth = this.getBeforeBenchWidth(firstRow);

    this.renderRows = this.rows.slice(firstBenchRow, lastBenchRow);
    this.wrapperPaddingLeft = scrollLeft - beforeRowsWidth;
  }

  /**
   * 스크롤 이벤트 추가
   */
  public addContainerScrollEvent(cb: ScrollCallBack): void {
    this.callback = cb;
  }

  /**
   * 스크롤 이벤트 제거
   */
  public removeContainerScrollEvent(): void {
    this.callback = null;
  }

  /**
   * 1. container 스크롤 이벤트 발생 시 호출
   *
   * @param e
   */
  public handleContainerScroll(e: Event): void {
    const target = e.target;

    if (target instanceof HTMLElement) {
      if ('horizontal' === this.options.direction) this.execHorizontalScroll(target.scrollLeft);
      else this.execVerticalScroll(target.scrollTop);
    }

    this.callback?.(e);
  }
  // #endregion

  // #region dynamic rows
  /**
   * 동적 높이를 가진 Rows 초기화
   */
  private initDynamicRows(): void {
    this.renderRows = this.rows;
  }
  // #endregion
}

export default FBVirtualScroll;
