import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import axios from 'axios';

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured, uploadCasePhoto } from '../lib/supabase';
import AddressSuggestField from '../components/AddressSuggestField';

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar se está logado
  useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um caso');
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        if (!isSupabaseConfigured()) {
          toast.error('Envio de foto indisponível no momento. Remova a imagem e tente novamente.');
          setIsLoading(false);
          return;
        }
        try {
          photoUrl = await uploadCasePhoto(photoFile);
          const v = await api.post(
            '/media/validate',
            {
              imageUrl: photoUrl,
              context: 'case_primary',
            },
            { timeout: 120_000 },
          );
          if (!v.data?.success) {
            toast.error(v.data?.message || 'Foto não passou na validação automática.');
            setIsLoading(false);
            return;
          }
        } catch (err: unknown) {
          toast.error(
            apiErrorMessage(err, 'Falha no upload ou validação da foto. Tente uma imagem menor ou aguarde alguns segundos.'),
          );
          setIsLoading(false);
          return;
        }
      }

      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        missingPersonName: formData.missingPersonName,
      };

      if (photoUrl) {
        payload.photoUrl = photoUrl;
      }

      // Adicionar campos opcionais apenas se preenchidos
      if (formData.age) {
        const age = parseInt(formData.age, 10);
        if (Number.isNaN(age) || age < 60) {
          setErrors({
            age: 'Este sistema é destinado a idosos (idade mínima de 60 anos).',
          });
          setIsLoading(false);
          return;
        }
        payload.age = age;
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
      const response = await api.post('/cases', payload as object);

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
      <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-bold mb-6 text-dark tracking-tight">Criar Novo Caso</h1>
        
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
            <span className="mb-1 block text-sm font-medium text-dark">
              Foto da pessoa desaparecida (opcional)
            </span>
            <p className="mb-2 text-xs text-muted">
              Se quiser, adicione uma foto para facilitar a identificação.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  return;
                }
                if (f.size > 5 * 1024 * 1024) {
                  toast.error('Imagem deve ter no máximo 5 MB');
                  return;
                }
                setPhotoFile(f);
                setPhotoPreview(URL.createObjectURL(f));
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-dark hover:bg-muted-bg/80"
              >
                Escolher imagem
              </button>
              {photoPreview ? (
                <>
                  <img
                    src={photoPreview}
                    alt="Pré-visualização"
                    className="h-24 w-24 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    className="text-sm font-medium text-red-600 hover:underline"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Remover
                  </button>
                </>
              ) : null}
            </div>
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
                min="60"
                max="120"
              />
              <p className="mt-1 text-xs text-muted">
                O Sagasu é focado na localização de pessoas idosas (60+).
              </p>
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
            <AddressSuggestField
              id="lastSeenLocation"
              value={formData.lastSeenLocation}
              onChange={(v) => setFormData({ ...formData, lastSeenLocation: v })}
              cityHint="Belo Horizonte"
              placeholder="Ex.: Rua Progresso, 1389 — Savassi"
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
              className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-fg ring-1 ring-primary/30 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Criando...' : 'Criar Caso'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/cases')}
              className="rounded-xl border border-border px-6 py-3 font-semibold text-dark hover:bg-muted-bg/80"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
