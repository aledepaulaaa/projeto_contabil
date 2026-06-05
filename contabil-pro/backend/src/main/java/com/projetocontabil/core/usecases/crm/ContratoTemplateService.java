package com.projetocontabil.core.usecases.crm;

import org.springframework.stereotype.Service;
import java.util.Map;

/**
 * Serviço responsável por gerar o conteúdo (HTML) do contrato 
 * seguindo fielmente o modelo oficial (MODELO CONTRATO SERVICOS CONTABEIS.docx).
 */
@Service
public class ContratoTemplateService {

    public String gerarHtmlContrato(Map<String, String> dados) {
        String razaoSocial = dados.getOrDefault("RAZAO_SOCIAL", "CONTRATANTE EXPLOIT");
        String nomeContato = dados.getOrDefault("NOME_CONTATO", "REPRESENTANTE LEGAL");
        String identificacao = dados.getOrDefault("IDENTIFICACAO", "00.000.000/0001-00");
        String valorMensal = dados.getOrDefault("VALOR_MENSAL", "R$ 499,00");
        String endereco = dados.getOrDefault("ENDERECO", "Endereço não informado");

        return """
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; padding: 40px; }
                    .header { text-align: center; font-weight: bold; font-size: 18px; text-decoration: underline; margin-bottom: 30px; }
                    .secao { margin-top: 20px; text-align: justify; }
                    .destaque-red { color: #EE0000; font-weight: bold; }
                    .assinaturas { margin-top: 50px; display: flex; justify-content: space-between; }
                    .linha { border-top: 1px solid black; width: 250px; text-align: center; padding-top: 5px; }
                    .clausula { font-weight: bold; margin-top: 15px; display: block; }
                </style>
            </head>
            <body>
                <div class="header">CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS</div>

                <div class="secao">
                    <p><strong>CONTRATADA:</strong> SUPREME CONTABILIDADE LTDA, estabelecida na Rua da Prosperidade, 1000, 
                    inscrita no CNPJ sob o nº 00.000.000/0001-00, representada por <span class="destaque-red">IZABELLA GIANNONE FERNANDES MENDES</span>, 
                    inscrita no CPF sob o nº <span class="destaque-red">423.977.448-99</span>, na qualidade de Sócio Administrador.</p>

                    <p><strong>CONTRATANTE:</strong> <span class="destaque-red">%s</span>, com endereço em <span class="destaque-red">%s</span>, 
                    inscrita sob o CPF/CNPJ nº <span class="destaque-red">%s</span>, representada neste ato por <span class="destaque-red">%s</span>.</p>
                </div>

                <div class="secao">
                    <span class="clausula">Cláusula 1ª - DO OBJETO</span>
                    <p>O presente contrato tem como objeto a prestação, pela CONTRATADA à CONTRATANTE, de serviços profissionais contábeis 
                    e de assessoria fiscal/trabalhista, conforme as rotinas do plano selecionado.</p>

                    <span class="clausula">Cláusula 2ª - DOS HONORÁRIOS</span>
                    <p>Pelos serviços ora contratados, a CONTRATANTE pagará à CONTRATADA o valor mensal fixo de <span class="destaque-red">%s</span> 
                    (por competência), com vencimento conforme acordado no onboarding.</p>

                    <span class="clausula">Cláusula 3ª - DA VIGÊNCIA E RESCISÃO</span>
                    <p>Este contrato tem validade por prazo indeterminado. Qualquer das partes poderá rescindi-lo com aviso prévio de 30 dias.</p>
                </div>

                <div class="secao">
                    <p>E, por estarem assim justos e contratados, assinam o presente instrumento para que surta seus efeitos legais.</p>
                </div>

                <div class="assinaturas" style="margin-top: 80px;">
                    <div style="float: left;">
                        <div class="linha">SUPREME CONTABILIDADE</div>
                        <div style="font-size: 10px; color: blue; text-align: center;">✓ Assinado via ZapSign (OneClick)</div>
                    </div>
                    <div style="float: right;">
                        <div class="linha">%s</div>
                        <div style="font-size: 10px; color: blue; text-align: center;">✓ Assinado via ZapSign (OneClick)</div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(razaoSocial, endereco, identificacao, nomeContato, valorMensal, nomeContato);
    }
}
