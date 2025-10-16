import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/Modal';
import { useProducts } from '../../../../context/ProductContext';
import styles from './AddLocationModal.module.css';
import { ProductLocation } from '../../../../types';

type AddLocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: Omit<ProductLocation, 'name'> & { volumeToMove?: number }) => void;
  mode: 'add' | 'edit';
  initialData?: ProductLocation | null;
  isSubmitting: boolean;
};

export function AddLocationModal({ isOpen, onClose, onSave, mode, initialData, isSubmitting }: AddLocationModalProps) {
  const { findProductBySku } = useProducts();

  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [location, setLocation] = useState('');
  const [unitsPerBox, setUnitsPerBox] = useState(0);
  const [volume, setVolume] = useState(0);
  const [volumeToMove, setVolumeToMove] = useState(1);
  const [date, setDate] = useState(new Date().toLocaleDateString('pt-BR'));

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setSku(initialData.sku);
        setProductName(initialData.name);
        setLocation(''); // Campo de destino começa vazio
        setUnitsPerBox(initialData.unitsPerBox);
        setVolumeToMove(1);
        setDate(initialData.date);
      } else {
        setSku(''); 
        setProductName(''); 
        setLocation(''); 
        setUnitsPerBox(0); 
        setVolume(0);
        setDate(new Date().toLocaleDateString('pt-BR'));
      }
    }
  }, [isOpen, mode, initialData]);

  useEffect(() => {
    if (mode === 'add' && sku) {
      const foundProduct = findProductBySku(sku);
      setProductName(foundProduct?.name || '');
      setUnitsPerBox(foundProduct?.unitsPerBox || 0);
    }
  }, [sku, findProductBySku, mode]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'add') {
      if (!productName) { alert('SKU inválido ou não encontrado.'); return; }
      if (unitsPerBox <= 0 || volume <= 0) { alert('Valores numéricos devem ser maiores que zero.'); return; }
      onSave({
        sku, location, unitsPerBox, volume, date,
        id: ''
      });
    } else { // Modo 'edit' (movimentar)
      if (!initialData) return;
      if (volumeToMove <= 0) { alert('A quantidade a movimentar deve ser maior que zero.'); return; }
      if (volumeToMove > initialData.volume) { alert('Não pode movimentar mais caixas do que as existentes.'); return; }
      onSave({
        sku, location, unitsPerBox, volume: 0, date, volumeToMove,
        id: ''
      });
    }
  };
  
  const handleClose = () => { onClose(); };

  const modalTitle = mode === 'edit' ? `Movimentar ${initialData?.name}` : 'Incluir Produto no Estoque';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="sku">SKU</label>
          <input id="sku" type="text" value={mode === 'edit' ? initialData?.sku : sku} onChange={(e) => setSku(e.target.value)} required readOnly={mode === 'edit'} className={mode === 'edit' ? styles.readOnlyInput : ''} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="name">Produto</label>
          <input id="name" type="text" value={mode === 'edit' ? initialData?.name : productName} readOnly className={styles.readOnlyInput} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="location">{mode === 'edit' ? `Nova Localização (Origem: ${initialData?.location})` : 'Localização'}</label>
          <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        
        {mode === 'edit' ? (
          <div className={styles.formGroup}>
            <label htmlFor="volumeToMove">Nº de Caixas a Movimentar (de {initialData?.volume})</label>
            <input id="volumeToMove" type="number" min="1" max={initialData?.volume} value={volumeToMove} onChange={(e) => setVolumeToMove(parseInt(e.target.value))} required />
          </div>
        ) : (
          <div className={styles.formGroupRow}>
            <div className={styles.formGroup}>
              <label htmlFor="unitsPerBox">Unidades p/ Caixa</label>
              <input id="unitsPerBox" type="number" min="0" value={unitsPerBox} onChange={(e) => setUnitsPerBox(parseInt(e.target.value))} required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="volume">Nº de Caixas (Volume)</label>
              <input id="volume" type="number" min="0" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} required />
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="date">Data</label>
          <input id="date" type="text" value={date} readOnly className={styles.readOnlyInput} />
        </div>

        <footer className={styles.formFooter}>
          <button type="button" onClick={handleClose} className={styles.cancelButton}>Cancelar</button>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</button>
        </footer>
      </form>
    </Modal>
  );
}

