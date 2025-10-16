import { useState, useEffect } from 'react';
import { Modal } from '../../../../components/Modal';
import styles from './AddProductModal.module.css';
import { Product } from '../../../../types';

// O onSave agora espera todos os campos editáveis
type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'quantity' | 'history'>) => void;
  mode: 'add' | 'edit' | 'clone';
  initialData?: Product | null;
  isSubmitting: boolean; // <-- Recebe a nova prop
};

export function AddProductModal({ isOpen, onClose, onSave, mode, initialData ,isSubmitting }: AddProductModalProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState(0);
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [repurchaseRule, setRepurchaseRule] = useState(0); // Novo estado


  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setCostPrice(initialData.costPrice);
      setBrand(initialData.brand);
      setColor(initialData.color || '');
      setRepurchaseRule(initialData.repurchaseRule || 0); // Preenche a regra
      if (mode === 'clone') {
        setSku('');
      } else {
        setSku(initialData.sku);
      }
    }
  }, [isOpen, initialData, mode]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (repurchaseRule <= 0) {
      alert('A Regra de Recompra deve ser um número maior que zero.');
      return;
    }
    onSave({ sku, name, costPrice, brand, color, repurchaseRule });
  };

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setSku(''); setName(''); setCostPrice(0); setBrand(''); setColor(''); setRepurchaseRule(0);
    onClose();
  };

  const modalTitle = mode === 'edit' ? 'Editar Produto' : (mode === 'clone' ? 'Clonar Produto' : 'Adicionar Novo Produto');
  const saveButtonText = mode === 'edit' ? 'Salvar Alterações' : 'Salvar Produto';
  //arrumar botão
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="sku">SKU</label>
          <input id="sku" type="text" value={sku} onChange={(e) => setSku(e.target.value)} required readOnly={mode === 'edit'} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="name">Nome do Produto</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className={styles.formGroupRow}>
          <div className={styles.formGroup}>
            <label htmlFor="costPrice">Preço de Custo</label>
            <input id="costPrice" type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(parseFloat(e.target.value))} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="color">Cor (Opcional)</label>
            <input id="color" type="text" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
        <div className={styles.formGroupRow}>
          <div className={styles.formGroup}>
            <label htmlFor="brand">Marca</label>
            <input id="brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="repurchaseRule">Regra de Recompra (Mín.)</label>
            <input id="repurchaseRule" type="number" min="0" value={repurchaseRule} onChange={(e) => setRepurchaseRule(parseInt(e.target.value))} required />
          </div>
        </div>
        <footer className={styles.formFooter}>
          <button type="button" onClick={handleClose} className={styles.cancelButton}>Cancelar</button>
          <button type="submit" className={styles.submitButton}>{saveButtonText} disabled={isSubmitting}
        {isSubmitting ? 'Salvando...' : 'Salvar Produto'} </button>
        </footer>
      </form>
    </Modal>
  );
}
