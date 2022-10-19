import { nextTick, onMounted, ref, watch } from 'vue';
import type { Ref, PropType } from 'vue';
import { CustomEmit, PropRequiredTrue } from '@/interfaces/types';
import VirtualScroll from '../../../../../libs/virtual-scroll';

// #region Emits & Props
type Emits = 'container-scroll' | 'updated';
interface Props {
  /**
   * v-for key에 들어 갈 유니크 값
   */
  key: string;
  direction: 'vertical' | 'horizontal';
  
  containerTag: string;
  containerClass: string | Record<string, any>;
  containerStyle: Record<string, string>;
  wrapperTag: string;
  wrapperClass: string | Record<string, any>;
  wrapperStyle: Record<string, string>;
  itemTag: string;
  itemClass: string | Record<string, any>;
  itemStyle: Record<string, string>;
  
  bench: number;
  rows: any[];
}

const emits: Emits[] = ['container-scroll', 'updated'];
const props = {
  direction: {
    type: String as PropType<Props['direction']>,
    default: 'vertical',
    required: false,
  },

  containerTag: {
    type: String as PropType<Props['containerTag']>,
    default: 'div',
    required: false,
  },

  containerClass: {
    type: [String, Object] as PropType<Props['containerClass']>,
    default: '',
    required: false,
  },

  containerStyle: {
    type: [String, Object] as PropType<Props['containerStyle']>,
    default: '',
    required: false,
  },

  wrapperTag: {
    type: String as PropType<Props['wrapperTag']>,
    default: 'ul',
    required: false,
  },

  wrapperClass: {
    type: [String, Object] as PropType<Props['wrapperClass']>,
    default: '',
    required: false,
  },

  wrapperStyle: {
    type: [String, Object] as PropType<Props['wrapperStyle']>,
    default: '',
    required: false,
  },

  itemTag: {
    type: String as PropType<Props['itemTag']>,
    default: 'li',
    required: false,
  },

  itemClass: {
    type: [String, Object] as PropType<Props['itemClass']>,
    default: '',
    required: false,
  },

  itemStyle: {
    type: [String, Object] as PropType<Props['itemStyle']>,
    default: '',
    required: false,
  },

  bench: {
    type: Number as PropType<Props['bench']>,
    default: 5,
    required: false,
  },

  rows: {
    type: Array as PropType<Props['rows']>,
    required: true as PropRequiredTrue,
  },
};
// #endregion

export default function fbVirtualScrollComposable(emit: CustomEmit<Emits>, props: Props) {
  let virtualScroll: VirtualScroll;

  /**
   * 렌더링 할 Rows
   */
  const renderRows: Ref<any[]> = ref([]);
  const refContainer = ref<HTMLElement>();
  const refWrapper = ref<HTMLElement>();

  // #region 공통
  /**
   * 외부로 내본 낼 속성들
   */
  const getExposeProperties = () => {
    return {
      moveVerticalScrollToRow
    };
  };

  /**
   * 화면 업데이트
   */
  const updateView = () => {
    renderRows.value = virtualScroll.getRenderRows();

    updateWrapperStyle();
    firstRenderRowIndex.value = virtualScroll.getRenderFirstRowIndex();
  };

  /**
   * row에 해당하는 위치로 스크롤 이동
   * 
   * @param row 이동 할 row
   */
  const moveVerticalScrollToRow = (row: number) => {
    if (!virtualScroll) return;

    updateView();
  };
  // #endregion

  // #region container
  /**
   * 1. container 스크롤 이벤트 발생 시 호출
   * 
   * @param e 
   */
  const handleContainerScroll = (e: Event) => {
    if (!virtualScroll) return;

    updateView();
    emit('container-scroll', e);
  };
  // #endregion

  // #region wrapper
  const wrapperStyle = ref<Partial<CSSStyleDeclaration>>();
  const updateWrapperStyle = () => {
    if (!virtualScroll) return { ...props.wrapperStyle };
    
    wrapperStyle.value = {
      ...virtualScroll.getWrapperStyle(),
      ...props.wrapperStyle,
    };
  };
  // #endregion

  const firstRenderRowIndex = ref(0);

  /**
   * 모듈 초기화
   */
  const initModule = async () => {
    await nextTick();

    watch(() => props.rows, async (newValue) => {
      renderRows.value = props.rows;

      await nextTick();
      
      if (!refContainer.value || !refWrapper.value) return;
      if (null !== virtualScroll) {
        const vs = virtualScroll.updateRows(renderRows.value);

        vs.rendered();
      }
      else {
        virtualScroll = new VirtualScroll(refContainer.value, refWrapper.value, {
          bench: props.bench,
          rows: renderRows.value,
          direction: props.direction
        });
        virtualScroll.addContainerScrollEvent(handleContainerScroll);
      }

      await nextTick();

      updateWrapperStyle();
      renderRows.value = virtualScroll.getRenderRows();
      
      emit('updated');
    }, {
      immediate: true,
    });
  };

  onMounted(() => {
    initModule();
  });

  return {
    // #region 공통
    getExposeProperties,
    // #endregion

    refContainer,
    renderRows,
    refWrapper,
    wrapperStyle,
    firstRenderRowIndex,
  };
}

export {
  Emits,
  Props,
};

export {
  emits,
  props,
};