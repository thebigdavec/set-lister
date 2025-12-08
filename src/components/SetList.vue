<script setup lang="ts">
import { lastSetId, removeSet, store } from "../store";
import Set from "./Set.vue";
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
