<template>
  <component
    :is="containerTag"
    ref="refContainer"
    @scroll="handleContainerScroll($event)"
  >
    <slot name="before-wrapper"></slot>
    <component
      :is="wrapperTag"
      ref="refWrapper"
      :class="wrapperClass"
      :style="wrapperStyle"
    >
      <slot name="before-item"></slot>
      <component
        :is="itemTag"
        v-for="(row, index) in renderRows"
        :key="`virtual-scroll-item-${index}`"
        :class="itemClass"
        :style="itemStyle"
      >
        <slot
          :row="row"
          :index="index"
        ></slot>
      </component>
      <slot name="after-item"></slot>
    </component>
    <slot name="after-wrapper"></slot>
  </component>
</template>
<script setup lang="ts">
  import fbModuleComposable, { emits as moduleEmits, props as moduleProps } from '@/composables/modules/virtual-scroll';

  const emit = defineEmits(moduleEmits);
  const props = defineProps(moduleProps);
  const {
    refContainer,
    refWrapper,
    renderRows,
    wrapperStyle,
    handleContainerScroll
  } = fbModuleComposable(emit, props);
</script>