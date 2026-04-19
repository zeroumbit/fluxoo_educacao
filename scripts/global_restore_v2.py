import os
import re

def global_restore():
    src_dir = r'c:\PROJETOS\01 FLUXOO\01 fluxoo-edu\src'
    
    # Padroes comuns que foram corrompidos
    patterns = [
        r'\b_supabase\b',
        r'\b_setValue\b',
        r'\b_watch\b',
        r'\b_handleSubmit\b',
        r'\b_register\b',
        r'\b_reset\b',
        r'\b_control\b',
        r'\b_errors\b',
        r'\b_useForm\b',
        r'\b_useQuery\b',
        r'\b_useEffect\b',
        r'\b_useState\b',
        r'\b_isMobile\b',
        r'\b_navigate\b',
        r'\b_location\b',
        r'\b_faturas\b',
        r'\b_aluno\b',
        r'\b_turma\b',
        r'\b_vinculos\b',
        r'\b_isLoading\b',
        r'\b_data\b',
        r'\b_toast\b',
        r'\b_portalService\b',
        r'\b_configPix\b',
        r'\b_queryClient\b',
        r'\b_schema\b'
    ]
    
    # Uma regex mais generica para pegar qualquer ._propriedade
    prop_regex = re.compile(r'\.(_[a-zA-Z][a-zA-Z0-9]*)')
    
    # Regex para pegar _variavel em contextos de desestruturacao ou uso
    # mas evitar _ (sozinho) ou __ (duplo)
    var_regex = re.compile(r'\b_([a-zA-Z][a-zA-Z0-9]*)\b')

    count = 0
    files_fixed = 0

    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original = content
                    
                    # 1. Corrigir acessos de propriedade: aluno._turma -> aluno.turma
                    content = prop_regex.sub(r'.\1'.replace('_', '', 1), content)
                    
                    # 2. Corrigir variaveis especificas conhecidas (mais seguro que global)
                    for p in patterns:
                        target = p
                        replacement = p.replace('_', '', 1)
                        content = re.sub(target, replacement, content)
                    
                    # 3. Corrigir padroes de desestruturacao comuns: { _setValue, _watch }
                    # Vamos focar em nomes de hooks e funcoes conhecidas do react-hook-form etc
                    if original != content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        files_fixed += 1
                        print(f"Fixed: {path}")
                except Exception as e:
                    print(f"Error processing {path}: {e}")

    print(f"Saneamento concluido. Arquivos corrigidos: {files_fixed}")

if __name__ == "__main__":
    global_restore()
