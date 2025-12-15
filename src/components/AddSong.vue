<script setup lang="ts">
import { ref } from "vue";
import { Check } from "lucide-vue-next";

const props = defineProps<{
    songCount: number;
}>();

const emit = defineEmits<{
    (e: "add", payload: { title: string; key: string }): void;
}>();

const titleInputRef = ref<HTMLInputElement | null>(null);
const newSongTitle = ref("");
const newSongKey = ref("");

function addSong(): void {
    if (!newSongTitle.value.trim()) return;

    emit("add", {
        title: newSongTitle.value,
        key: newSongKey.value,
    });

    newSongTitle.value = "";
    newSongKey.value = "";

    titleInputRef.value?.focus();
}

defineExpose({
    focusTitleInput: () => titleInputRef.value?.focus(),
});
</script>

<template>
    <div class="add-song no-print">
        Add {{ songCount === 0 ? "first" : "next" }} song
        <div class="add-song-form">
            <input
                ref="titleInputRef"
                v-model="newSongTitle"
                placeholder="Song Title"
                @keyup.enter="addSong"
            />
            <input
                v-model="newSongKey"
                placeholder="Song Key"
                class="key-input"
                @keyup.enter="addSong"
            />
            <Button v-if="newSongTitle.length" class="primary" @click="addSong">
                <Check class="icon" /> Add
            </Button>
        </div>
    </div>
</template>

<style scoped>
.add-song {
    text-align: center;
    color: #bbbbbb;
    background: #333;
    padding: 0.5rem;
    margin-block-end: 0.5rem;
    border-block-end: 2px solid #242424;
    border-radius: 3px;

    .add-song-form {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.25rem;
        flex-wrap: wrap;

        input {
            border-color: var(--accent-color);

            &:not(.key-input) {
                flex: 1;
            }
        }
    }
}
</style>
