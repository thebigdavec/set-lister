<script setup lang="ts">
import { computed } from "vue";
import { store, removeSet } from "../store";
import Set from "./Set.vue";

const lastSetId = computed(() =>
    store.sets.length ? store.sets[store.sets.length - 1].id : null
);
</script>

<template>
    <div class="sets-wrapper">
        <Set
            v-for="set in store.sets"
            :key="set.id"
            :set="set"
            :is-last="set.id === lastSetId"
            @remove-set="removeSet(set.id)"
        />
    </div>
</template>

<style scoped>
.sets-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    align-items: start;
}
</style>
