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

export function AddProductModal({ isOpen, onClose, onSave, mode, initialData, isSubmitting }: AddProductModalProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState(0);
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [repurchaseRule, setRepurchaseRule] = useState(0); // Novo estado
  const [imageUrl, setImageUrl] = useState(''); // Novo estado para a imagem
  const [supplier, setSupplier] = useState('');


  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setCostPrice(initialData.costPrice);
      setBrand(initialData.brand);
      setColor(initialData.color || '');
      setRepurchaseRule(initialData.repurchaseRule || 0); // Preenche a regra
      setImageUrl(initialData.imageUrl || ''); // Preenche o link da imagem
      setSupplier(initialData.supplier || ''); 
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
    onSave({ sku, name, costPrice, brand, color, repurchaseRule, imageUrl, supplier });
  };

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setSku(''); setName(''); setCostPrice(0); setBrand(''); setColor(''); setRepurchaseRule(0); setImageUrl(''); setSupplier('');
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
          {/* Adicionado campo Fornecedor da Versão 2 */}
          <div className={styles.formGroup}>
            <label htmlFor="supplier">Origem (Fornecedor)</label>
            <input id="supplier" type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} required />
          </div>
        </div>
        
        {/* Linha: Regra de Recompra (Mantido layout da Versão 1, mas pode ficar sozinho se preferir) */}
        <div className={styles.formGroup}> 
          <label htmlFor="repurchaseRule">Regra de Recompra (Mín.)</label>
          <input id="repurchaseRule" type="number" min="0" value={repurchaseRule} onChange={(e) => setRepurchaseRule(parseInt(e.target.value))} required />
        </div>

        {/* Link da Imagem (igual em ambos, mas ajustado rótulo da V1) */}
        <div className={styles.formGroup}>
          <label htmlFor="imageUrl">Link da Imagem do Produto (Opcional)</label>
          <input id="imageUrl" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://exemplo.com/imagem.png" />
        </div>

        {/* Footer com botão 'isSubmitting' da Versão 1 */}
        <footer className={styles.formFooter}>
          <button type="button" onClick={handleClose} className={styles.cancelButton}>Cancelar</button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting} 
          >
            {isSubmitting ? 'Salvando...' : saveButtonText}
          </button>
        </footer>
      </form>
    </Modal>
  );
} 