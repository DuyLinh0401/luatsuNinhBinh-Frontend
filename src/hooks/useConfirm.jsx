import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '../components/admin/ui/AdminUI';

// const [confirm, confirmDialog] = useConfirm();
// if (await confirm({ title, message, confirmText })) { ... }   — nhớ render {confirmDialog}
const useConfirm = () => {
  const [state, setState] = useState(null);

  const confirm = (options) =>
    new Promise((resolve) => setState({ tone: 'danger', confirmText: 'Xác nhận', ...options, resolve }));

  const close = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const dialog = (
    <Modal
      open={!!state}
      onClose={() => close(false)}
      size="sm"
      title={state?.title || 'Xác nhận'}
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>Huỷ</Button>
          <Button variant={state?.tone === 'danger' ? 'danger' : 'primary'} onClick={() => close(true)}>
            {state?.confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {state?.tone === 'danger' && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
        )}
        <p className="text-sm leading-relaxed text-slate-600">{state?.message}</p>
      </div>
    </Modal>
  );

  return [confirm, dialog];
};

export default useConfirm;
