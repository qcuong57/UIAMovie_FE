// src/components/admin/ads/AdDeleteModal.jsx
import React from "react";
import { AlertTriangle } from "lucide-react";
import { useAdMutations } from "../../../hooks/admin/useAdminAds";
import { getApiErrorMessage } from "../../../utils/apiError";
import { useToast } from "../common/Toast";
import ConfirmDeleteModal, {
  InfoBox,
  WarnBox,
  IrreversibleNote,
} from "../common/ConfirmDeleteModal";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";

export default function AdDeleteModal({ ad, onClose, onDeleted }) {
  const toast = useToast();
  const { deleteAd } = useAdMutations();

  const handleDelete = async () => {
    try {
      await deleteAd.mutateAsync(ad.id);
      toast.success(`Đã xóa quảng cáo "${ad.title}"`);
      onDeleted?.(ad.id);
    } catch (e) {
      console.error(e);
      toast.error(getApiErrorMessage(e, "Có lỗi xảy ra khi xóa"));
    }
  };

  const slotCount = ad?.globalSlotCount ?? ad?.globalSlots?.length ?? 0;

  return (
    <ConfirmDeleteModal
      open={!!ad}
      title="Xóa quảng cáo"
      confirmLabel="Xóa quảng cáo"
      busy={deleteAd.isPending}
      onConfirm={handleDelete}
      onClose={onClose}
    >
      {ad && (
        <>
          <InfoBox title={ad.title}>
            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0 }}>
              ID: {ad.id?.slice(0, 8)}… · {ad.durationSeconds}s
              {ad.skipAfterSeconds != null ? ` · skip sau ${ad.skipAfterSeconds}s` : ""}
            </p>
          </InfoBox>

          {slotCount > 0 && (
            <WarnBox icon={<AlertTriangle size={14} color={T.gold} />}>
              Quảng cáo này đang được gắn vào <strong>{slotCount} global slot</strong>. Xóa sẽ gỡ toàn bộ slot liên quan.
            </WarnBox>
          )}

          <IrreversibleNote>File video trên Cloudinary cũng sẽ bị xóa vĩnh viễn.</IrreversibleNote>
        </>
      )}
    </ConfirmDeleteModal>
  );
}