"""Status de acompanhamento de restituição IRPF."""

from app.models.declaracao import Declaracao

STATUS_A_RESTITUIR = "a_restituir"
STATUS_PENDENTE = "pendente"
STATUS_RESTITUIDO = "restituido"
STATUS_ERRO_CREDITO = "erro_credito"

_LABELS = {
    STATUS_A_RESTITUIR: "A restituir",
    STATUS_PENDENTE: "Pendente",
    STATUS_RESTITUIDO: "Restituído",
    STATUS_ERRO_CREDITO: "Erro ao creditar",
}


def label_status(codigo: str) -> str:
    return _LABELS.get(codigo, codigo)


def derivar_status_restituicao(row: Declaracao) -> str:
    if row.restituicao_status in _LABELS:
        return str(row.restituicao_status)
    if row.restituicao_erro_motivo:
        return STATUS_ERRO_CREDITO
    if row.restituicao_paga is True or row.data_pagamento_restituicao:
        return STATUS_RESTITUIDO
    if row.indicacao_malha_fina or row.status_processamento_rfb == "pendencia_malha":
        return STATUS_PENDENTE
    return STATUS_A_RESTITUIR
