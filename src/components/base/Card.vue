<template>
    <div class="card">
        <slot />
    </div>
</template>
<style scoped>
.card {
    background-color: var(--card-bg);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}
</style>
