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
import { store, updateMetadata } from "../store";
import { shortcuts } from "../utils/keyboardShortcuts";
import { LIMITS } from "../constants/limits";

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
		!store.metadata.setListName &&
		!store.metadata.venue &&
		!store.metadata.actName &&
		!store.metadata.date
	);
});

onMounted(() => {
	if (noDetailsExist.value) {
		isEditingMetadata.value = true;
	}
});
</script>

<template>
	<Card class="metadata">
		<div class="metadata-title">
			<h2 v-if="noDetailsExist">Enter Setlist Details</h2>
			<h2 v-else-if="store.metadata.setListName">
				{{ store.metadata.setListName }}
			</h2>
			<h2 v-else>Untitled Setlist</h2>
			<Button
				v-if="isEditingMetadata"
				@click="toggleEditingMetadata"
				tooltip="Finish editing details"
				aria-label="Finish editing details"
				class="success"
			>
				<Check class="icon" /> Done
			</Button>
			<Button
				v-else
				@click="toggleEditingMetadata"
				tooltip="Start editing details"
				aria-label="Edit details"
				nowrap
			>
				<Pencil class="icon" /> Edit Set Details
			</Button>
		</div>
		<div v-if="isEditingMetadata" class="metadata-grid">
			<div class="input-group">
				<label for="setListName">Set List Name</label>
				<input
					id="setListName"
					v-model="store.metadata.setListName"
					:maxlength="LIMITS.MAX_METADATA_FIELD_LENGTH"
					placeholder="e.g. Summer Tour 2024"
					@blur="
						updateMetadata({
							setListName: store.metadata.setListName,
						})
					"
					@keyup.enter="blurInputOnEnter"
				/>
			</div>
			<div class="input-group">
				<label for="actName">Act Name</label>
				<input
					id="actName"
					v-model="store.metadata.actName"
					:maxlength="LIMITS.MAX_METADATA_FIELD_LENGTH"
					placeholder="e.g. The Beatles"
					@blur="
						updateMetadata({
							actName: store.metadata.actName,
						})
					"
					@keyup.enter="blurInputOnEnter"
				/>
			</div>

			<div class="input-group">
				<label for="venue">Venue</label>
				<input
					id="venue"
					v-model="store.metadata.venue"
					:maxlength="LIMITS.MAX_METADATA_FIELD_LENGTH"
					placeholder="e.g. The O2 Arena"
					@blur="updateMetadata({ venue: store.metadata.venue })"
					@keyup.enter="blurInputOnEnter"
				/>
			</div>

			<div class="input-group">
				<label for="date">Date</label>
				<input
					id="date"
					v-model="store.metadata.date"
					:maxlength="LIMITS.MAX_METADATA_FIELD_LENGTH"
					type="date"
					@blur="updateMetadata({ date: store.metadata.date })"
					@keyup.enter="blurInputOnEnter"
				/>
			</div>
		</div>
		<div v-else class="metadata-details">
			<div v-if="store.metadata.actName" class="metadata-detail">
				<Users class="icon" />
				{{ store.metadata.actName }}
			</div>
			<div v-if="store.metadata.venue" class="metadata-detail">
				<MapPin class="icon" />
				{{ store.metadata.venue }}
			</div>
			<div v-if="store.metadata.date" class="metadata-detail">
				<Calendar class="icon" />
				{{ store.metadata.date }}
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
				<Button
					@click="emit('export')"
					class="action-item"
					:disabled="!hasSets"
					nowrap
					:tooltip="`Preview & Print (${shortcuts.print})`"
					aria-label="PreviewSet List"
				>
					<Share class="icon" style="color: inherit" />
					Export/Print Set List
				</Button>
				<Button
					@click="emit('add-set')"
					nowrap
					class="action-item primary"
					:tooltip="`Add A New Set (${shortcuts.addSet})`"
					aria-label="Add set"
				>
					<Plus class="icon" /> Add New Set
				</Button>
			</div>
		</div>
	</Card>
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

	button {
		font-size: 1rem;
		background: #242424;
		transition: background-color 0.2s ease;
		&:hover,
		&:focus-visible {
			background: #444;
		}
	}
}

.metadata-detail {
	display: flex;
	gap: 0.5rem;
	align-items: center;
	color: #ddd;

	&.metadata-detail--heading {
		color: #e3e3e3;
	}
}

.icon {
	color: #cca;
}
</style>
