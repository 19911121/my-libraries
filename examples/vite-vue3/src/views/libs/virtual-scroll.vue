<template>
  <main>
    <h1>
      Virtual Scroll
    </h1>

    <virtual-scroll
      class="virtual-scroll__conatiner"
      :rows="rows"
      :bench="3"
    >
      <template #default="{ row, rowIndex }">
        <span>
          <em class="row">{{ row.row + rowIndex }}</em>
          {{ row.value }}
        </span>
      </template>
    </virtual-scroll>

    <h1>
      Virtual Scroll Table
    </h1>

    <virtual-scroll-table
      class="virtual-scroll__conatiner"
      :rows="rows"
      :bench="1"
    >
      <template #default="{ row }">
        <td class="row">
          {{ row.rowIndex }}
        </td>
        <td class="value">
          {{ row.value }}
        </td>
      </template>
    </virtual-scroll-table>
  </main>
</template>
<script setup lang="ts">
  import { ref } from 'vue';
  import virtualScroll from '@/components/modules/virtual-scroll.vue';
  import virtualScrollTable from '@/components/modules/virtual-scroll-table.vue';
  import type { Ref } from 'vue';

  export interface Row {
    rowIndex: number;
    value: number;
  }

  const rows: Ref<Row[]> = ref(Array.from({ length: 10000 }, (_, i): Row => {
    return {
      rowIndex: i + 1,
      value: i
    };
  }));

  // onMounted(() => {
  //   setTimeout(() => {
  //     console.log('row update!');
  //     rows.value = rows.value.map(v => {
  //       return {
  //         row: v.row * 2,
  //         value: v.value * 2
  //       };
  //     });
  //   }, 5000);
  // });
</script>

<style lang="scss" scoped>
  .virtual-scroll {
    &__conatiner {
      display: block;
      overflow: auto;
      width: 500px;
      max-height: 300px;
      margin: auto;

      :deep() .row {
        display: inline-block;
        width: 100px;
      }
    }
  }
</style>