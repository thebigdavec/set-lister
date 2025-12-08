import { describe, it, expect, beforeEach } from "vitest";
import { useDialogs } from "../useDialogs";

describe("useDialogs", () => {
  describe("initial state", () => {
    it("should have confirm dialog hidden initially", () => {
      const { confirmDialog } = useDialogs();
      expect(confirmDialog.value.show).toBe(false);
    });

    it("should have alert dialog hidden initially", () => {
      const { alertDialog } = useDialogs();
      expect(alertDialog.value.show).toBe(false);
    });

    it("should have default confirm dialog values", () => {
      const { confirmDialog } = useDialogs();
      expect(confirmDialog.value.title).toBe("");
      expect(confirmDialog.value.message).toBe("");
      expect(confirmDialog.value.confirmText).toBe("Confirm");
      expect(confirmDialog.value.cancelText).toBe("Cancel");
      expect(confirmDialog.value.danger).toBe(false);
    });

    it("should have default alert dialog values", () => {
      const { alertDialog } = useDialogs();
      expect(alertDialog.value.title).toBe("");
      expect(alertDialog.value.message).toBe("");
      expect(alertDialog.value.okText).toBe("OK");
    });
  });

  describe("showConfirm", () => {
    it("should show confirm dialog with provided options", async () => {
      const { confirmDialog, showConfirm, handleConfirm } = useDialogs();

      const promise = showConfirm({
        title: "Test Title",
        message: "Test message",
      });

      expect(confirmDialog.value.show).toBe(true);
      expect(confirmDialog.value.title).toBe("Test Title");
      expect(confirmDialog.value.message).toBe("Test message");

      // Resolve the promise
      handleConfirm();
      await promise;
    });

    it("should use custom confirm and cancel text", async () => {
      const { confirmDialog, showConfirm, handleConfirm } = useDialogs();

      const promise = showConfirm({
        title: "Delete?",
        message: "Are you sure?",
        confirmText: "Yes, Delete",
        cancelText: "No, Keep",
      });

      expect(confirmDialog.value.confirmText).toBe("Yes, Delete");
      expect(confirmDialog.value.cancelText).toBe("No, Keep");

      handleConfirm();
      await promise;
    });

    it("should support danger mode", async () => {
      const { confirmDialog, showConfirm, handleConfirm } = useDialogs();

      const promise = showConfirm({
        title: "Danger",
        message: "This is dangerous",
        danger: true,
      });

      expect(confirmDialog.value.danger).toBe(true);

      handleConfirm();
      await promise;
    });

    it("should return true when confirmed", async () => {
      const { showConfirm, handleConfirm } = useDialogs();

      const promise = showConfirm({
        title: "Confirm",
        message: "Confirm?",
      });

      handleConfirm();
      const result = await promise;
      expect(result).toBe(true);
    });

    it("should return false when cancelled", async () => {
      const { showConfirm, handleCancel } = useDialogs();

      const promise = showConfirm({
        title: "Confirm",
        message: "Confirm?",
      });

      handleCancel();
      const result = await promise;
      expect(result).toBe(false);
    });

    it("should hide dialog after confirm", async () => {
      const { confirmDialog, showConfirm, handleConfirm } = useDialogs();

      const promise = showConfirm({
        title: "Test",
        message: "Test",
      });

      expect(confirmDialog.value.show).toBe(true);
      handleConfirm();
      await promise;
      expect(confirmDialog.value.show).toBe(false);
    });

    it("should hide dialog after cancel", async () => {
      const { confirmDialog, showConfirm, handleCancel } = useDialogs();

      const promise = showConfirm({
        title: "Test",
        message: "Test",
      });

      expect(confirmDialog.value.show).toBe(true);
      handleCancel();
      await promise;
      expect(confirmDialog.value.show).toBe(false);
    });

    it("should use default values for optional parameters", async () => {
      const { confirmDialog, showConfirm, handleConfirm } = useDialogs();

      const promise = showConfirm({
        title: "Title",
        message: "Message",
      });

      expect(confirmDialog.value.confirmText).toBe("Confirm");
      expect(confirmDialog.value.cancelText).toBe("Cancel");
      expect(confirmDialog.value.danger).toBe(false);

      handleConfirm();
      await promise;
    });
  });

  describe("showAlert", () => {
    it("should show alert dialog with provided options", async () => {
      const { alertDialog, showAlert, handleAlertOk } = useDialogs();

      const promise = showAlert({
        title: "Alert Title",
        message: "Alert message",
      });

      expect(alertDialog.value.show).toBe(true);
      expect(alertDialog.value.title).toBe("Alert Title");
      expect(alertDialog.value.message).toBe("Alert message");

      handleAlertOk();
      await promise;
    });

    it("should use custom OK text", async () => {
      const { alertDialog, showAlert, handleAlertOk } = useDialogs();

      const promise = showAlert({
        title: "Info",
        message: "Information",
        okText: "Got it",
      });

      expect(alertDialog.value.okText).toBe("Got it");

      handleAlertOk();
      await promise;
    });

    it("should resolve when OK is clicked", async () => {
      const { showAlert, handleAlertOk } = useDialogs();

      let resolved = false;
      const promise = showAlert({
        title: "Alert",
        message: "Alert",
      }).then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);
      handleAlertOk();
      await promise;
      expect(resolved).toBe(true);
    });

    it("should hide dialog after OK", async () => {
      const { alertDialog, showAlert, handleAlertOk } = useDialogs();

      const promise = showAlert({
        title: "Test",
        message: "Test",
      });

      expect(alertDialog.value.show).toBe(true);
      handleAlertOk();
      await promise;
      expect(alertDialog.value.show).toBe(false);
    });

    it("should use default OK text when not provided", async () => {
      const { alertDialog, showAlert, handleAlertOk } = useDialogs();

      const promise = showAlert({
        title: "Title",
        message: "Message",
      });

      expect(alertDialog.value.okText).toBe("OK");

      handleAlertOk();
      await promise;
    });
  });

  describe("multiple dialogs", () => {
    it("should handle sequential confirm dialogs", async () => {
      const { showConfirm, handleConfirm, handleCancel } = useDialogs();

      const promise1 = showConfirm({
        title: "First",
        message: "First dialog",
      });
      handleConfirm();
      const result1 = await promise1;
      expect(result1).toBe(true);

      const promise2 = showConfirm({
        title: "Second",
        message: "Second dialog",
      });
      handleCancel();
      const result2 = await promise2;
      expect(result2).toBe(false);
    });

    it("should handle sequential alert dialogs", async () => {
      const { showAlert, handleAlertOk } = useDialogs();

      let count = 0;

      const promise1 = showAlert({
        title: "First",
        message: "First alert",
      }).then(() => count++);
      handleAlertOk();
      await promise1;
      expect(count).toBe(1);

      const promise2 = showAlert({
        title: "Second",
        message: "Second alert",
      }).then(() => count++);
      handleAlertOk();
      await promise2;
      expect(count).toBe(2);
    });

    it("should maintain separate state for confirm and alert dialogs", async () => {
      const {
        confirmDialog,
        alertDialog,
        showConfirm,
        showAlert,
        handleConfirm,
        handleAlertOk,
      } = useDialogs();

      // Show confirm dialog
      const confirmPromise = showConfirm({
        title: "Confirm Title",
        message: "Confirm message",
      });

      expect(confirmDialog.value.show).toBe(true);
      expect(alertDialog.value.show).toBe(false);

      handleConfirm();
      await confirmPromise;

      // Show alert dialog
      const alertPromise = showAlert({
        title: "Alert Title",
        message: "Alert message",
      });

      expect(confirmDialog.value.show).toBe(false);
      expect(alertDialog.value.show).toBe(true);

      handleAlertOk();
      await alertPromise;
    });
  });

  describe("state immutability", () => {
    it("should return readonly confirm dialog state", () => {
      const { confirmDialog } = useDialogs();
      // The state should be readonly (TypeScript enforces this)
      // We verify the object exists and has expected structure
      expect(confirmDialog.value).toHaveProperty("show");
      expect(confirmDialog.value).toHaveProperty("title");
      expect(confirmDialog.value).toHaveProperty("message");
    });

    it("should return readonly alert dialog state", () => {
      const { alertDialog } = useDialogs();
      expect(alertDialog.value).toHaveProperty("show");
      expect(alertDialog.value).toHaveProperty("title");
      expect(alertDialog.value).toHaveProperty("message");
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings in options", async () => {
      const { confirmDialog, showConfirm, handleConfirm } = useDialogs();

      const promise = showConfirm({
        title: "",
        message: "",
      });

      expect(confirmDialog.value.title).toBe("");
      expect(confirmDialog.value.message).toBe("");

      handleConfirm();
      await promise;
    });

    it("should handle very long text in options", async () => {
      const { confirmDialog, showConfirm, handleConfirm } = useDialogs();

      const longText = "A".repeat(10000);
      const promise = showConfirm({
        title: longText,
        message: longText,
      });

      expect(confirmDialog.value.title).toBe(longText);
      expect(confirmDialog.value.message).toBe(longText);

      handleConfirm();
      await promise;
    });

    it("should handle special characters in options", async () => {
      const { confirmDialog, showConfirm, handleConfirm } = useDialogs();

      const promise = showConfirm({
        title: "<script>alert('xss')</script>",
        message: "Test & \"quotes\" 'single' <brackets>",
      });

      expect(confirmDialog.value.title).toBe("<script>alert('xss')</script>");
      expect(confirmDialog.value.message).toBe("Test & \"quotes\" 'single' <brackets>");

      handleConfirm();
      await promise;
    });
  });
});
