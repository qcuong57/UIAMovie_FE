// src/components/admin/ads/AdSlotDeleteModal.jsx
// Xác nhận xóa 1 Global Slot.
import React from "react";
import { AlertTriangle } from "lucide-react";
import { useAdMutations } from "../../../hooks/useAdminAds";
import { getApiErrorMessage } from "../../../utils/apiError";
import { useToast } from "../common/Toast";
import ConfirmDeleteModal, {
  InfoBox,
  WarnBox,
  IrreversibleNote,
} from "../common/ConfirmDeleteModal";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";
import { PositionBadge, fmtClock } from "./AdTimeline";
import { scopeLabel } from "./adContentScopes";

export default function AdSlotDeleteModal({ slot, adTitle, isLastSlot = false, onClose, onDeleted }) {
  const toast = useToast();
  const { deleteSlot } = useAdMutations();

  const handleDelete = async () => {
    try {
      await deleteSlot.mutateAsync(slot.slotId);
      toast.success("Đã xóa lịch phát");
      onDeleted?.(slot.slotId);
    } catch (e) {
      console.error(e);
      toast.error(getApiErrorMessage(e, "Có lỗi xảy ra khi xóa"));
    }
  };

  return (
    <ConfirmDeleteModal
      open={!!slot}
      title="Xóa lịch phát"
      confirmLabel="Xóa lịch phát"
      busy={deleteSlot.isPending}
      onConfirm={handleDelete}
      onClose={onClose}
    >
      {slot && (
        <>
          <InfoBox title={adTitle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <PositionBadge position={slot.position} />
              <span style={{ fontFamily: FONT, fontSize: 12, color: T.textSub }}>
                {scopeLabel(slot.appliesTo)}
                {slot.position === "MidRoll" && slot.midRollOffsetSeconds != null
                  ? ` · tại ${fmtClock(slot.midRollOffsetSeconds)}`
                  : ""}
                {` · thứ tự ${slot.displayOrder}`}
              </span>
            </div>
          </InfoBox>

          {isLastSlot && (
            <WarnBox icon={<AlertTriangle size={14} color={T.gold} />}>
              Đây là <strong>lịch phát cuối cùng</strong> của quảng cáo. Xóa xong quảng cáo sẽ không còn được phát (và rời khỏi kho ngẫu nhiên) cho tới khi bạn gắn lại.
            </WarnBox>
          )}

          <IrreversibleNote>
            Quảng cáo và video vẫn được giữ nguyên, chỉ lịch phát này bị gỡ.
          </IrreversibleNote>
        </>
      )}
    </ConfirmDeleteModal>
  );
}