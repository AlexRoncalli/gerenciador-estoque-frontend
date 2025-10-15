import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import styles from './EditObservvationModal.module.css'; // Usaremos um CSS próprio

type EditObservationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newObservation: string) => void;
  initialObservation: string;
};

export function EditObservationModal({ isOpen, onClose, onSave, initialObservation }: EditObservationModalProps) {
  const [observation, setObservation] = useState('');

  useEffect(() => {
    if (isOpen) {
      setObservation(initialObservation);
    }
  }, [isOpen, initialObservation]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(observation);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Observação">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="observation">Nova Observação</label>
          <textarea
            id="observation"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className={styles.textarea}
            rows={4}
          />
        </div>
        <footer className={styles.formFooter}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
          <button type="submit" className={styles.submitButton}>Salvar Alteração</button>
        </footer>
      </form>
    </Modal>
  );
}