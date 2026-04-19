import os
import re

def global_restore_v3():
    src_dir = r'c:\PROJETOS\01 FLUXOO\01 fluxoo-edu\src'
    
    # Padrao 1: _ seguido de Letra Maiuscula (Componentes e Tipos) -> AlertaProfessor
    type_regex = re.compile(r'\b_([A-Z][a-zA-Z0-9]*)\b')
    
    # Padrao 2: ._propriedade ou . _propriedade -> .propriedade
    prop_regex = re.compile(r'\.\s*(_[a-zA-Z][a-zA-Z0-9]*)')
    
    # Padrao 3: Lista de palavras-chave conhecidas que foram corrompidas
    common_words = [
        'use', 'set', 'handle', 'is', 'has', 'get', 'find', 'map', 'filter', 'reduce',
        'query', 'mutate', 'auth', 'supabase', 'toast', 'control', 'errors', 'register',
        'watch', 'reset', 'handleSubmit', 'aluno', 'aluna', 'turma', 'professor', 'professora',
        'tenant', 'config', 'data', 'result', 'item', 'items', 'notifications', 'loading',
        'error', 'success', 'navigate', 'location', 'params', 'search', 'ref', 'memo',
        'callback', 'effect', 'state', 'context', 'schema', 'form', 'zod', 'resolver',
        'vinculos', 'familyData', 'cobrancaAtiva', 'showCheckout', 'selectedCobrancaId',
        'pix', 'comprovante', 'fatura', 'faturas', 'alerta', 'alertas', 'pendencia', 'pendencias',
        'saude', 'agenda', 'diaria', 'atividades', 'notas', 'frequencia', 'planos', 'boletim',
        'perfil', 'logout', 'signOut', 'authUser'
    ]
    
    # Regex para pegar _palavra (ex: _aluno, _useForm)
    word_regex = re.compile(r'\b_(' + '|'.join(common_words) + r')\b', re.IGNORECASE)

    files_fixed = 0

    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original = content
                    
                    # 1. Corrigir tipos e componentes: _AlertaProfessor -> AlertaProfessor
                    content = type_regex.sub(r'\1', content)
                    
                    # 2. Corrigir acessos: obj._prop -> obj.prop
                    # Note: prop_regex.sub(lambda m: '.' + m.group(1)[1:], content)
                    def fix_prop(m):
                        val = m.group(1)
                        if val.startswith('_'):
                            return '.' + val[1:]
                        return '.' + val
                    content = prop_regex.sub(fix_prop, content)
                    
                    # 3. Corrigir palavras comuns prefixadas
                    content = word_regex.sub(r'\1', content)
                    
                    # 4. Corrigir imports/exports desestruturados com espacos extras (caso existam)
                    # Ex: {  setValue ,  watch  } -> { setValue, watch }
                    # (Opcional, mas limpa o codigo)
                    
                    if original != content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        files_fixed += 1
                        print(f"Fixed: {path}")
                except Exception as e:
                    print(f"Error processing {path}: {e}")

    print(f"Saneamento v3 concluido. Arquivos corrigidos: {files_fixed}")

if __name__ == "__main__":
    global_restore_v3()
