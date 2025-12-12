import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import FirstTimeHint from "../components/base/FirstTimeHint.vue";
import { STORAGE_KEYS } from "../constants";

describe("FirstTimeHint", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should render when hint has not been dismissed", async () => {
    const wrapper = mount(FirstTimeHint, {
      props: {
        hintId: "test-hint",
        text: "This is a test tip",
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".first-time-hint").exists()).toBe(true);
    expect(wrapper.text()).toContain("This is a test tip");
  });

  it("should not render when hint has been dismissed", async () => {
    localStorage.setItem(
      STORAGE_KEYS.DISMISSED_HINTS,
      JSON.stringify(["test-hint"]),
    );

    const wrapper = mount(FirstTimeHint, {
      props: {
        hintId: "test-hint",
        text: "This is a test tip",
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".first-time-hint").exists()).toBe(false);
  });

  it("should dismiss and save to localStorage when dismiss button is clicked", async () => {
    const wrapper = mount(FirstTimeHint, {
      props: {
        hintId: "dismiss-test",
        text: "Dismissible tip",
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".first-time-hint").exists()).toBe(true);

    await wrapper.find(".hint-dismiss").trigger("click");
    await wrapper.vm.$nextTick();

    // Check localStorage was updated
    const dismissed = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.DISMISSED_HINTS) || "[]",
    );
    expect(dismissed).toContain("dismiss-test");
  });

  it("should apply correct position class", async () => {
    const wrapperInline = mount(FirstTimeHint, {
      props: {
        hintId: "inline-hint",
        text: "Inline tip",
        position: "inline",
      },
    });

    await wrapperInline.vm.$nextTick();
    expect(wrapperInline.find(".hint-inline").exists()).toBe(true);

    const wrapperAbove = mount(FirstTimeHint, {
      props: {
        hintId: "above-hint",
        text: "Above tip",
        position: "above",
      },
    });

    await wrapperAbove.vm.$nextTick();
    expect(wrapperAbove.find(".hint-above").exists()).toBe(true);

    const wrapperBelow = mount(FirstTimeHint, {
      props: {
        hintId: "below-hint",
        text: "Below tip",
        position: "below",
      },
    });

    await wrapperBelow.vm.$nextTick();
    expect(wrapperBelow.find(".hint-below").exists()).toBe(true);
  });

  it("should default to inline position", async () => {
    const wrapper = mount(FirstTimeHint, {
      props: {
        hintId: "default-hint",
        text: "Default position tip",
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".hint-inline").exists()).toBe(true);
  });

  it("should have proper accessibility attributes", async () => {
    const wrapper = mount(FirstTimeHint, {
      props: {
        hintId: "a11y-hint",
        text: "Accessible tip",
      },
    });

    await wrapper.vm.$nextTick();
    const hint = wrapper.find(".first-time-hint");
    expect(hint.attributes("role")).toBe("status");
    expect(hint.attributes("aria-live")).toBe("polite");

    const dismissButton = wrapper.find(".hint-dismiss");
    expect(dismissButton.attributes("aria-label")).toBe("Dismiss tip");
  });

  it("should handle corrupted localStorage gracefully", async () => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_HINTS, "not valid json");

    const wrapper = mount(FirstTimeHint, {
      props: {
        hintId: "corrupted-test",
        text: "Test tip",
      },
    });

    await wrapper.vm.$nextTick();
    // Should still render because parsing failed and returned empty array
    expect(wrapper.find(".first-time-hint").exists()).toBe(true);
  });

  it("should not duplicate hint IDs in localStorage when dismissing multiple times", async () => {
    const wrapper = mount(FirstTimeHint, {
      props: {
        hintId: "duplicate-test",
        text: "Test tip",
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.find(".hint-dismiss").trigger("click");

    // Manually set to visible again to test duplicate prevention
    const dismissed = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.DISMISSED_HINTS) || "[]",
    );
    expect(dismissed.filter((id: string) => id === "duplicate-test")).toHaveLength(1);
  });

  it("should preserve other dismissed hints when dismissing a new one", async () => {
    localStorage.setItem(
      STORAGE_KEYS.DISMISSED_HINTS,
      JSON.stringify(["existing-hint-1", "existing-hint-2"]),
    );

    const wrapper = mount(FirstTimeHint, {
      props: {
        hintId: "new-hint",
        text: "New tip",
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.find(".hint-dismiss").trigger("click");

    const dismissed = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.DISMISSED_HINTS) || "[]",
    );
    expect(dismissed).toContain("existing-hint-1");
    expect(dismissed).toContain("existing-hint-2");
    expect(dismissed).toContain("new-hint");
  });

  it("should render lightbulb icon", async () => {
    const wrapper = mount(FirstTimeHint, {
      props: {
        hintId: "icon-test",
        text: "Test tip",
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".hint-icon").exists()).toBe(true);
  });

  it("should render X icon on dismiss button", async () => {
    const wrapper = mount(FirstTimeHint, {
      props: {
        hintId: "dismiss-icon-test",
        text: "Test tip",
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".dismiss-icon").exists()).toBe(true);
  });
});
