import { useState } from 'react'

export const ESTADOS_BRASIL = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

export function useViaCEP() {
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<{ value: string; label: string }[]>([])
  const [loadingCities, setLoadingCities] = useState(false)

  const fetchAddressByCEP = async (cep: string) => {
    const cleanedCEP = cep.replace(/\D/g, '')
    if (cleanedCEP.length !== 8) return null

    setLoading(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCEP}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        return { error: 'CEP não encontrado' }
      }

      return {
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      }
    } catch (error) {
      return { error: 'Erro ao buscar o CEP' }
    } finally {
      setLoading(false)
    }
  }

  const fetchCitiesByUF = async (uf: string) => {
    if (!uf || uf.length !== 2) {
      setCities([])
      return
    }

    setLoadingCities(true)
    try {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      const data = await response.json()
      
      const formattedCities = data.map((city: any) => ({
        value: city.nome,
        label: city.nome,
      })).sort((a: any, b: any) => a.label.localeCompare(b.label))

      setCities(formattedCities)
    } catch (error) {
      console.error('Erro ao buscar cidades:', error)
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  return {
    loading,
    loadingCities,
    cities,
    fetchAddressByCEP,
    fetchCitiesByUF,
    estados: ESTADOS_BRASIL,
  }
}
