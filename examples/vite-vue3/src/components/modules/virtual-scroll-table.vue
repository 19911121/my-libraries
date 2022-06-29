<template>
  <div
    ref="refContainer"
    class="virtual-scroll__container"
    :class="containerClass"
    @scroll="handleContainerScroll($event)"
  >
    <div
      :style="wrapperStyle"
    >
      <table
        :class="tableClass"
        :style="tableStyle"
      >
        <slot name="before-tbody"></slot>
        <tbody
          ref="refWrapper"
        >
          <slot name="before-tr"></slot>
          <template
            v-for="(row, index) in renderRows"
            :key="`virtual-scroll-table-row-${index}`"
          >
            <tr
              :class="itemClass"
              :style="itemStyle"
            >
              <slot
                :row="row"
                :index="index"
              >
              </slot>
            </tr>
          </template>
          <slot
            v-if="!renderRows?.length"
            name="empty"
          ></slot>
          <slot name="after-tr"></slot>
        </tbody>
        <slot name="after-tbody"></slot>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
  import fbModuleComposable, { emits as moduleEmits, props as moduleProps } from '@/composables/modules/virtual-scroll-table';

  const emit = defineEmits(moduleEmits);
  const props = defineProps(moduleProps);
  const {
    refContainer,
    renderRows,
    refWrapper,
    wrapperStyle,
    // tableStyle,
    handleContainerScroll,
  } = fbModuleComposable(emit, props);

</script>