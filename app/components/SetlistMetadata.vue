<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
	Share,
	Users,
	MapPin,
	Calendar,
	Pencil,
	Check,
	Plus,
} from "lucide-vue-next";
import { useSetlistStore } from "../stores/store";
import { shortcuts } from "../utils/keyboardShortcuts";
import { LIMITS } from "../constants/limits";

const store = useSetlistStore();

const isEditingMetadata = ref(false);

const emit = defineEmits(["add-set", "export", "update:showSongNumbers"]);

const props = defineProps({
	hasSets: {
		type: Boolean,
		default: false,
	},
	showSongNumbers: {
		type: Boolean,
		default: false,
	},
});

function toggleSongNumbers() {
	emit("update:showSongNumbers", !props.showSongNumbers);
}

const toggleEditingMetadata = () => {
	isEditingMetadata.value = !isEditingMetadata.value;
};

function blurInputOnEnter(e: KeyboardEvent) {
	const target = e.target as HTMLInputElement;
	target.blur();
}

const noDetailsExist = computed(() => {
	return (
		!store.state.metadata.setListName &&
		!store.state.metadata.venue &&
		!store.state.metadata.actName &&
		!store.state.metadata.date
	);
});

onMounted(() => {
	if (noDetailsExist.value) {
		isEditingMetadata.value = true;
	}
});
</script>

<template>
	<BaseCard class="metadata">
		<div class="metadata-title">
			<h2 v-if="noDetailsExist">Enter Setlist Details</h2>
			<h2 v-else-if="store.state.metadata.setListName">
				{{ store.state.metadata.setListName }}
			</h2>
			<h2 v-else>Untitled Setlist</h2>
			<BaseButton
				v-if="isEditingMetadata"
				@click="toggleEditingMetadata"
				tooltip="Finish editing details"
				aria-label="Finish editing details"
				class="success"
			>
				<Check class="icon" /> Done
			</BaseButton>
			<BaseButton
				v-else
				@click="toggleEditingMetadata"
				tooltip="Start editing details"
				aria-label="Edit details"
				nowrap
			>
				<Pencil class="icon" /> Edit Set Details
			</BaseButton>
		</div>
		<div v-if="isEditingMetadata" class="metadata-grid">
			<div class="input-group">
				<label for="setListName">Set List Name</label>
				<input
					id="setListName"
					v-model="store.state.metadata.setListName"
					:maxlength="LIMITS.MAX_METADATA_FIELD_LENGTH"
					placeholder="e.g. Summer Tour 2024"
					@blur="
						store.updateMetadata({
							setListName: store.state.metadata.setListName,
						})
					"
					@keyup.enter="blurInputOnEnter"
				/>
			</div>
			<div class="input-group">
				<label for="actName">Act Name</label>
				<input
					id="actName"
					v-model="store.state.metadata.actName"
					:maxlength="LIMITS.MAX_METADATA_FIELD_LENGTH"
					placeholder="e.g. The Beatles"
					@blur="
						store.updateMetadata({
							actName: store.state.metadata.actName,
						})
					"
					@keyup.enter="blurInputOnEnter"
				/>
			</div>

			<div class="input-group">
				<label for="venue">Venue</label>
				<input
					id="venue"
					v-model="store.state.metadata.venue"
					:maxlength="LIMITS.MAX_METADATA_FIELD_LENGTH"
					placeholder="e.g. The O2 Arena"
					@blur="store.updateMetadata({ venue: store.state.metadata.venue })"
					@keyup.enter="blurInputOnEnter"
				/>
			</div>

			<div class="input-group">
				<label for="date">Date</label>
				<input
					id="date"
					v-model="store.state.metadata.date"
					:maxlength="LIMITS.MAX_METADATA_FIELD_LENGTH"
					type="date"
					@blur="store.updateMetadata({ date: store.state.metadata.date })"
					@keyup.enter="blurInputOnEnter"
				/>
			</div>
		</div>
		<div v-else class="metadata-details">
			<div v-if="store.state.metadata.actName" class="metadata-detail">
				<Users class="icon" />
				{{ store.state.metadata.actName }}
			</div>
			<div v-if="store.state.metadata.venue" class="metadata-detail">
				<MapPin class="icon" />
				{{ store.state.metadata.venue }}
			</div>
			<div v-if="store.state.metadata.date" class="metadata-detail">
				<Calendar class="icon" />
				{{ store.state.metadata.date }}
			</div>
		</div>
		<div class="set-list-footer">
			<label class="view-option" :class="{ active: showSongNumbers }">
				<input
					type="checkbox"
					:checked="showSongNumbers"
					@change="toggleSongNumbers"
				/>
				<span>Show song numbers</span>
			</label>
			<div class="set-list-actions">
				<BaseButton
					@click="emit('export')"
					class="action-item"
					:disabled="!hasSets"
					nowrap
					:tooltip="`Preview & Print (${shortcuts.print})`"
					aria-label="PreviewSet List"
				>
					<Share class="icon" style="color: inherit" />
					Export/Print Set List
				</BaseButton>
				<BaseButton
					@click="emit('add-set')"
					nowrap
					class="action-item primary"
					:tooltip="`Add A New Set (${shortcuts.addSet})`"
					aria-label="Add set"
				>
					<Plus class="icon" /> Add New Set
				</BaseButton>
			</div>
		</div>
	</BaseCard>
</template>

<style scoped>
.metadata {
	display: grid;
	gap: 1em;
}

.metadata-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
}

.set-list-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	flex-wrap: wrap;
	margin-block-start: 1em;
}

.set-list-actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.5em;
	align-items: center;
}

.view-option {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	font-size: 0.8rem;
	color: var(--text-color-muted);
	cursor: pointer;
	transition: color 0.2s ease;
	user-select: none;

	&:hover,
	&:focus-visible {
		color: var(--text-color-hover);
	}

	&.active {
		color: var(--text-color-active);
	}
}

.input-group {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}

.metadata-details {
	display: flex;
	flex-direction: column;
	> * {
		margin: 0;
		padding: 0;
	}
}

.metadata-title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 0.5rem;

	h2 {
		font-size: var(--card-title-fs);
		margin: 0;
		padding: 0;
	}
}

.metadata-detail {
	display: flex;
	gap: 0.5rem;
	align-items: center;
	color: var(--text-color-muted);
}

.icon {
	color: var(--accent-color);
}
</style>
