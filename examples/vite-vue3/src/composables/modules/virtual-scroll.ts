import { nextTick, onMounted, ref, watch } from 'vue';
import type { Ref, PropType } from 'vue';
import { CustomEmit, PropRequiredTrue } from '@/interfaces/types';
import VirtualScroll from '../../../../../libs/virtual-scroll';

// #region Emits & Props
type Emits = 'container-scroll' | 'updated';
interface Props {
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

  direction: 'vertical' | 'horizontal';
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
  const virtualScroll = ref<VirtualScroll<any> | null>(null);

  /**
   * 렌더링 할 Rows
   */
  const renderRows: Ref<any[]> = ref([]);
  const refContainer = ref<HTMLElement>();
  const refWrapper = ref<HTMLElement>();

  // #region container
  /**
   * 1. container 스크롤 이벤트 발생 시 호출
   * 
   * @param e 
   */
  const handleContainerScroll = (e: Event) => {
    if (!virtualScroll.value) return;

    renderRows.value = virtualScroll.value.getRenderRows();

    updateWrapperStyle();
    firstRenderRowIndex.value = virtualScroll.value.getRenderFirstRowIndex();
    emit('container-scroll', e);
  };
  // #endregion

  // #region wrapper
  const wrapperStyle = ref<Partial<CSSStyleDeclaration>>();
  const updateWrapperStyle = () => {
    if (!virtualScroll.value) return { ...props.wrapperStyle };
    
    wrapperStyle.value = {
      ...virtualScroll.value.getWrapperStyle(),
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
      if (virtualScroll.value) {
        const vs = virtualScroll.value.updateRows(renderRows.value);

        vs.rendered();
      }
      else {
        virtualScroll.value = new VirtualScroll(refContainer.value, refWrapper.value, {
          bench: props.bench,
          rows: renderRows.value,
          direction: props.direction
        });
        virtualScroll.value.addContainerScrollEvent(handleContainerScroll);
      }

      await nextTick();

      updateWrapperStyle();
      renderRows.value = virtualScroll.value.getRenderRows();
      
      emit('updated');
    }, {
      immediate: true,
    });
  };

  onMounted(() => {
    initModule();
  });

  return {
    virtualScroll,
    refContainer,
    renderRows,
    refWrapper,
    wrapperStyle,
    firstRenderRowIndex,
    handleContainerScroll,
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