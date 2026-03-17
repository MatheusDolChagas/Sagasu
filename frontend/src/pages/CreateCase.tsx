import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function CreateCase() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    missingPersonName: '',
    age: '',
    gender: '',
    lastSeenLocation: '',
    lastSeenDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verificar se está logado
  useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um caso');
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        missingPersonName: formData.missingPersonName,
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (formData.age) {
        payload.age = parseInt(formData.age);
      }
      if (formData.gender) {
        payload.gender = formData.gender;
      }
      if (formData.lastSeenLocation) {
        payload.lastSeenLocation = formData.lastSeenLocation;
      }
      if (formData.lastSeenDate) {
        payload.lastSeenDate = formData.lastSeenDate;
      }

      const response = await api.post('/cases', payload);

      if (response.data.success) {
        toast.success('Caso criado com sucesso!');
        navigate(`/cases/${response.data.data.id}`);
      }
    } catch (error: any) {
      console.error('Create case error:', error);
      
      if (error.response?.data?.errors) {
        // Erros de validação do Zod
        const validationErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          validationErrors[err.path[0]] = err.message;
        });
        setErrors(validationErrors);
      } else {
        toast.error(error.response?.data?.message || 'Erro ao criar caso. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-dark">Criar Novo Caso</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-dark mb-1">
              Título do Caso *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.title ? 'border-accent' : 'border-dark'
              }`}
              placeholder="Ex: Idoso desaparecido no centro da cidade"
              required
            />
            {errors.title && (
              <p className="text-accent text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="missingPersonName" className="block text-sm font-medium text-dark mb-1">
              Nome da Pessoa Desaparecida *
            </label>
            <input
              type="text"
              id="missingPersonName"
              value={formData.missingPersonName}
              onChange={(e) => setFormData({ ...formData, missingPersonName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.missingPersonName ? 'border-accent' : 'border-dark'
              }`}
              required
            />
            {errors.missingPersonName && (
              <p className="text-accent text-sm mt-1">{errors.missingPersonName}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-dark mb-1">
                Idade
              </label>
              <input
                type="number"
                id="age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-2 border border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="1"
                max="120"
              />
              {errors.age && (
                <p className="text-accent text-sm mt-1">{errors.age}</p>
              )}
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-dark mb-1">
                Gênero
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-dark mb-1">
              Descrição Detalhada *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.description ? 'border-accent' : 'border-dark'
              }`}
              placeholder="Descreva detalhadamente o caso, características físicas, roupas que estava usando, etc."
              required
            />
            {errors.description && (
              <p className="text-accent text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastSeenLocation" className="block text-sm font-medium text-dark mb-1">
              Último Local Visto
            </label>
            <input
              type="text"
              id="lastSeenLocation"
              value={formData.lastSeenLocation}
              onChange={(e) => setFormData({ ...formData, lastSeenLocation: e.target.value })}
              className="w-full px-4 py-2 border border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: Rua das Flores, 123 - Centro"
            />
          </div>

          <div>
            <label htmlFor="lastSeenDate" className="block text-sm font-medium text-dark mb-1">
              Data do Desaparecimento
            </label>
            <input
              type="datetime-local"
              id="lastSeenDate"
              value={formData.lastSeenDate}
              onChange={(e) => setFormData({ ...formData, lastSeenDate: e.target.value })}
              className="w-full px-4 py-2 border border-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary text-white py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isLoading ? 'Criando...' : 'Criar Caso'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/cases')}
              className="px-6 py-3 border border-dark rounded-lg hover:bg-background text-dark"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
