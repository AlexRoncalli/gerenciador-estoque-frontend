import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/Modal';
import styles from './CreateExitModal.module.css';
import { ProductLocation, Store } from '../../../../types';

// Lista de lojas disponíveis
const availableStores: Store[] = ['Shein', 'Amazon', 'Mercado Livre', 'Shopee', 'Magazine Luiza'];

type CreateExitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  // onSave agora envia os dados da loja e a observação opcional
  onSave: (exitData: { exitType: 'Expedição' | 'Full', store?: Store, observation?: string, volumeToExit: number }) => void;
  locationData: ProductLocation | null;
  isSubmitting: boolean;
};

export function CreateExitModal({ isOpen, onClose, onSave, locationData, isSubmitting }: CreateExitModalProps) {
  const [exitType, setExitType] = useState<'Expedição' | 'Full'>('Expedição');
  const [store, setStore] = useState<Store | ''>(''); // Estado para a loja selecionada
  const [observation, setObservation] = useState('');
  const [volumeToExit, setVolumeToExit] = useState(1);
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reseta os campos ao abrir
      setExitType('Expedição');
      setStore('');
      setObservation('');
      setVolumeToExit(1);
    }
  }, [isOpen]);
  
  // Valida o botão de salvar em tempo real
  useEffect(() => {
    if (exitType === 'Full' && store === '') {
      setIsSaveDisabled(true); // Se for 'Full' e nenhuma loja estiver selecionada, desabilita
    } else {
      setIsSaveDisabled(false); // Caso contrário, habilita
    }
  }, [exitType, store]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!locationData) return;
    if (volumeToExit <= 0 || volumeToExit > locationData.volume) {
      alert(`O número de caixas para saída deve ser entre 1 e ${locationData.volume}.`);
      return;
    }
    onSave({ exitType, store: store || undefined, observation, volumeToExit });
  };
  
  const handleClose = () => { onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Registo de Saída">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.productInfo}>
          <div className={styles.infoField}><strong>SKU:</strong> {locationData?.sku}</div>
          <div className={styles.infoField}><strong>Produto:</strong> {locationData?.name}</div>
        </div>

        <div className={styles.formGroupRow}>
          <div className={styles.formGroup}>
            <label htmlFor="volumeToExit">Nº de Caixas para Saída</label>
            <input id="volumeToExit" type="number" min="1" max={locationData?.volume} value={volumeToExit} onChange={(e) => setVolumeToExit(parseInt(e.target.value))} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="unitsPerBox">Unidades p/ Caixa</label>
            <input id="unitsPerBox" type="number" value={locationData?.unitsPerBox || 0} readOnly className={styles.readOnlyInput} />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="exitType">Tipo de Saída</label>
          <select id="exitType" value={exitType} onChange={(e) => setExitType(e.target.value as 'Expedição' | 'Full')} className={styles.select}>
            <option value="Expedição">Expedição</option>
            <option value="Full">Full (Venda em Loja)</option>
          </select>
        </div>

        {/* O dropdown de lojas só aparece se o tipo for 'Full' */}
        {exitType === 'Full' && (
          <div className={styles.formGroup}>
            <label htmlFor="store">Selecione a Loja</label>
            <select id="store" value={store} onChange={(e) => setStore(e.target.value as Store)} required className={styles.select}>
              <option value="" disabled>-- Escolha uma loja --</option>
              {availableStores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="observation">Observação (Opcional)</label>
          <textarea id="observation" value={observation} onChange={(e) => setObservation(e.target.value)} className={styles.textarea} placeholder="Ex: Nota Fiscal 12345..." />
        </div>
        <footer className={styles.formFooter}>
          <button type="button" onClick={handleClose} className={styles.cancelButton}>Cancelar</button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting} // <-- A MÁGICA ACONTECE AQUI
          >
            {isSubmitting ? 'Salvando...' : 'Criar Saída'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

