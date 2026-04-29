<template>
	<div class="card">
		<slot />
	</div>
</template>
<style scoped>
.card {
	background-color: var(--bg-color-1);
	border: 1px solid var(--border-color-ghost);
	padding: 1rem;
	border-radius: 8px;
}
</style>
