import { computed, PropType } from 'vue';
import { CustomEmit } from '@/interfaces/types';
import virtualScrollComposable, { props as vsProps, Props as VSProps } from './virtual-scroll';

// #region Emits & Props
type Emits = 'container-scroll' | 'updated';
interface Props extends VSProps {
  tableClass: string | Record<string, any>;
  tableStyle: Record<string, string>;
}

const emits: Emits[] = ['container-scroll', 'updated'];
const props = {
  ...vsProps,
  
  tableClass: {
    type: [String, Object] as PropType<Props['tableClass']>,
    default: '',
    required: false,
  },

  tableStyle: {
    type: [String, Object] as PropType<Props['tableStyle']>,
    default: '',
    required: false,
  },

};
// #endregion

export default function virtualScrollTableComposable(emit: CustomEmit<Emits>, props: Props) {
  const {
    refContainer,
    renderRows,
    refWrapper,
    wrapperStyle,
    handleContainerScroll,
  } = virtualScrollComposable(emit, props);

  return {
    refContainer,
    renderRows,
    refWrapper,
    wrapperStyle,
    handleContainerScroll,
  };
}

export {
  emits,
  props,
};