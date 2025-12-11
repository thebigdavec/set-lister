<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Users, MapPin, Calendar, Pencil, X } from "lucide-vue-next";
import { store, updateMetadata } from "../store";

const isEditingMetadata = ref(false);

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
    <div class="card">
        <div class="metadata-title">
            <h2 v-if="noDetailsExist">Enter Setlist Details</h2>
            <h2 v-else-if="store.metadata.setListName">
                {{ store.metadata.setListName }}
            </h2>
            <h2 v-else>Untitled Setlist</h2>
            <Button
                v-if="isEditingMetadata"
                class="danger"
                @click="toggleEditingMetadata"
                title="Stop editing metadata"
            >
                <X class="icon" /> Close
            </Button>
            <Button v-else @click="toggleEditingMetadata" title="Edit metadata">
                <Pencil class="icon" /> Edit
            </Button>
        </div>
        <div v-if="isEditingMetadata" class="metadata-grid">
            <div class="input-group">
                <label>Set List Name</label>
                <input
                    v-model="store.metadata.setListName"
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
                <label>Act Name</label>
                <input
                    v-model="store.metadata.actName"
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
                <label>Venue</label>
                <input
                    v-model="store.metadata.venue"
                    placeholder="e.g. The O2 Arena"
                    @blur="updateMetadata({ venue: store.metadata.venue })"
                    @keyup.enter="blurInputOnEnter"
                />
            </div>

            <div class="input-group">
                <label>Date</label>
                <input
                    v-model="store.metadata.date"
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
    </div>
</template>

<style scoped>
.metadata-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.input-group label {
    font-size: 0.8rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.input-group input {
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #444;
    background: #222;
    color: white;
}

.input-group input:focus {
    border-color: var(--accent-color);
    outline: none;
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
    font-size: 1.6rem;
    color: #ddd;

    h2 {
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
