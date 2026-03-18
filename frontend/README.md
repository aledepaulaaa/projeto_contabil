Fase 10: O Grand Finale — Modularização SaaS, Segurança Argon2 e Assinaturas.

Diretrizes de Nomenclatura: Altere referências de Tenant para EmpresaLocataria no domínio. Mantenha a regra de negócio em Português Claro.

Execute as seguintes tarefas técnicas com precisão:

1. Backend: Segurança Argon2 e Validação (Core)
Hashing Premium (Argon2): Configure o DelegatingPasswordEncoder no SecurityConfig.java. Defina Argon2 como padrão para novas senhas e mantenha BCrypt como fallback legível. Adicione a dependência bcprov-jdk18on no pom.xml.
A Estratégia de Delegação (DelegatingPasswordEncoder)
No Spring Security, você não deve chumbar um único algoritmo para o sistema inteiro de forma engessada. A melhor prática é usar o DelegatingPasswordEncoder.

Ele funciona salvando o identificador do algoritmo no próprio banco de dados, como um prefixo no hash. Exemplo:

{argon2}$argon2id$v=19$m=16384,t=2... (Nova senha em Argon2)

{bcrypt}$2a$10$dXJ3SW6G... (Senha antiga legada em BCrypt)

Por que isso é a melhor prática? Porque quando surgir um algoritmo melhor que o Argon2 no futuro (ou se a computação quântica avançar e exigir uma mudança), você adiciona o novo algoritmo ao DelegatingPasswordEncoder e não quebra o login dos usuários antigos.

* Adicionando a Dependência Necessária
A implementação do Argon2 no Spring Security exige a biblioteca Bouncy Castle por baixo dos panos. Adicione no pom.xml
```
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk18on</artifactId>
    <version>1.77</version> </dependency>
</dependency>
```
## Exemplo de configuração do Spring Security com Argon2
* Configurando o Bean no Spring Security
Você precisa criar uma configuração para dizer ao Spring que o Argon2 é o seu novo padrão.

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // 1. Configuração do Argon2
        // Ajuste os parâmetros (memória, iterações) conforme a RAM do seu servidor
        int saltLength = 16;
        int hashLength = 32;
        int parallelism = 1;      // Threads
        int memory = 1 << 16;     // 64 MB de memória
        int iterations = 3;       // Custo de tempo

        Argon2PasswordEncoder argon2Encoder = new Argon2PasswordEncoder(
                saltLength, hashLength, parallelism, memory, iterations);

        // 2. Mapeando os encoders disponíveis
        Map<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("argon2", argon2Encoder);
        
        // Mantemos o BCrypt aqui APENAS para validar logins de usuários antigos, caso existam
        encoders.put("bcrypt", new BCryptPasswordEncoder());

        // 3. Criando o DelegatingPasswordEncoder e definindo o Argon2 como PADRÃO para novas senhas
        DelegatingPasswordEncoder delegatingPasswordEncoder = 
                new DelegatingPasswordEncoder("argon2", encoders);

        // Opcional: Se o seu banco atual tem senhas em BCrypt SEM o prefixo "{bcrypt}",
        // isso diz ao Spring para assumir que hashes sem prefixo são BCrypt.
        delegatingPasswordEncoder.setDefaultPasswordEncoderForMatches(new BCryptPasswordEncoder());

        return delegatingPasswordEncoder;
    }
}
```

3. Tratamento de Erros: Crie um GlobalExceptionHandler para retornar mensagens amigáveis (ex: 'Identificador já possui conta') ao invés de erro genérico 500 em casos de duplicidade. Isso será para o frontend, se já existir um tratamento de erros global, ajuste ele conforme necessário para não retornar erros genéricos, e sim mensagens amigáveis e legíveis para o usuário. É necessário também verificar no backend se os tratamento de erros/exceções estão bem organizadas e otimizadas para visualização correta dos tipos de erros retornados para o frontend, para logs e depurações no servidor.

Identificação Flexível: Garanta que o VO Identificacao aceite 11 (CPF) ou 14 (CNPJ) dígitos.

4. Backend: Regras de Assinatura
Período Trial: Implemente o campo dataFimTrial (7 dias) na criação da conta. Após esse período, APIs protegidas devem retornar 402 Payment Required, limitando o usuário apenas às rotas /configuracoes e /assinaturas.

5. Frontend: Layout SaaS e Navegação (Inspirado na Conta Azul)
Dashboard Layout: Refatore o Dashboard.tsx para ser um Layout base. A área central deve ser dinâmica, carregando o conteúdo de acordo com o menu selecionado.

Barra Lateral (Sidebar): Crie uma sidebar retrátil. Ela deve conter os módulos baseados no escopo original:

# Itens do menu da barra lateral
1. CRM (Expansível) -> Sub-item: Leads (Mova o ListaLeads para cá).
2. Onboarding (Alinhamento de expectativas).
3. Rotinas (Mova o CalendarioFiscal para cá).
4. Alvarás e Licenças.
5. Processos.

Menu do Usuário (Avatar): No header, ao clicar no Avatar do locatário, exiba um Dropdown menu com:

1. Configurações / Perfil (Formulário para completar Dados da Empresa/Pessoa, Upload de Foto compactada, Telefone).
2. Alterar Senha.
3. Termos de Uso.
4. Sair.

6. Frontend: Telas de Módulos (MVVM)
Distribua os componentes que estavam aglomerados no antigo painel central para suas novas rotas respectivas. A tela "Início" deve ter apenas os cards de resumo compactos.

Rota /assinaturas: Crie o layout (Glassmorphism) com 3 cards de planos de teste.

7. Qualidade e Documentação
Workflow: @beautifulMention
## Frontend - testes ##
Atualize os testes do Playwright (dashboard.spec.ts) para navegar pela nova barra lateral e testar o menu do Avatar.

## Backend - testes ##
Realizar testes com as features que serão implementadas no backend, seguindo a mesma estrategia de testes que foi feita desde o inicio da aplicação

Atualize os Resumos Técnicos e o Walkthrough refletindo a nova arquitetura de navegação (SPA Modular) e a segurança Argon2.

Meta: Sistema com navegação modular completa, perfil de usuário editável e segurança de nível bancário com Argon2.