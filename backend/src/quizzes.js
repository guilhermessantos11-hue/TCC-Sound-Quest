function q(prompt, correct, a, b, c) {
  const others = [a, b, c];
  const slot = Math.abs(hash(prompt)) % 4;
  const options = [];
  let oi = 0;
  for (let i = 0; i < 4; i += 1) {
    if (i === slot) options.push([correct, 1]);
    else options.push([others[oi++], 0]);
  }
  return { prompt, options };
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

const MODULE_QUIZZES = {
  "Fundamentos da NR-12": {
    title: "Atividade: Fundamentos da NR-12",
    description: "Perguntas sobre o objetivo da norma e os riscos de maquinas.",
    questions: [
      q(
        "Por que a NR-12 existe no ambiente industrial?",
        "Para garantir a saude e a integridade fisica dos trabalhadores junto as maquinas",
        "Para aumentar a velocidade da linha de producao",
        "Para substituir o uso de equipamentos de protecao individual",
        "Para reduzir o numero de pausas no turno"
      ),
      q(
        "No mapa visual de riscos, o que as zonas destacadas representam?",
        "Areas de perigo, protecoes e pontos de bloqueio que o operador deve reconhecer",
        "Somente o caminho mais curto ate o refeitorio",
        "Locais onde o uso de celular e liberado",
        "Setores administrativos da planta"
      ),
      q(
        "Qual atitude e correta antes de iniciar a operacao de uma maquina?",
        "Confirmar protecoes, sinalizacao e pontos de risco visiveis",
        "Remover a protecao para ver melhor a peca",
        "Ligar o equipamento mesmo com alarme ativo",
        "Ignorar o mapa de riscos se ja conhece a maquina"
      ),
      q(
        "Quem e responsavel por seguir os procedimentos de seguranca da NR-12?",
        "A empresa e cada colaborador, no seu papel",
        "Apenas o setor de RH",
        "Somente visitantes da planta",
        "Apenas o turno da noite"
      )
    ]
  },
  "Dispositivos de protecao": {
    title: "Atividade: Dispositivos de protecao",
    description: "Perguntas sobre EPI, LOTO, emergencia e protecoes.",
    questions: [
      q(
        "O que o colaborador deve verificar nos equipamentos de protecao?",
        "Se as protecoes fixas e moveis estao instaladas antes de operar",
        "Se da para tira-las para ganhar tempo",
        "Se estao pintadas da cor favorita da equipe",
        "Se o supervisor pediu para ignora-las"
      ),
      q(
        "O bloqueio e etiquetagem (LOTO) serve para:",
        "Impedir o religamento acidental enquanto ha manutencao",
        "Marcar a maquina como mais produtiva",
        "Substituir o treinamento de seguranca",
        "Liberar a linha mesmo com energia presente"
      ),
      q(
        "O botao de emergencia deve estar:",
        "Visivel, acessivel e identificado",
        "Escondido para ninguem acionar por engano",
        "Disponivel apenas na sala da gerencia",
        "Desligado para nao interromper a producao"
      ),
      q(
        "Protecoes moveis em maquinas devem estar associadas a:",
        "Intertravamentos de seguranca",
        "Aumento de velocidade da linha",
        "Remocao temporaria sem registro",
        "Uso exclusivo em feriados"
      )
    ]
  },
  "Comunicacao visual efetiva": {
    title: "Atividade: Comunicacao visual",
    description: "Perguntas sobre sinalizacao e paineis no chao de fabrica.",
    questions: [
      q(
        "A melhor forma de passar uma instrucao urgente no chao de fabrica e:",
        "Sinal visual padronizado combinado com mensagem escrita curta",
        "Apenas um aviso verbal a distancia",
        "Assobio sem contexto",
        "Esperar o fim do turno para avisar"
      ),
      q(
        "Cores consistentes de sinalizacao ajudam porque:",
        "Reduzem falhas e aumentam a seguranca de quem nao ouve o alarme",
        "Servem so para decorar a planta",
        "Substituem completamente os procedimentos escritos",
        "Sao opcionais quando a equipe ja se conhece"
      ),
      q(
        "Um painel de rotina acessivel deve mostrar:",
        "Icones, horarios e status visuais das tarefas",
        "Apenas textos longos sem destaque",
        "Somente o nome da empresa",
        "Informacoes escondidas em menus de audio"
      ),
      q(
        "Acessibilidade no ambiente industrial inclui:",
        "Informacao critica disponivel de forma visual, nao so sonora",
        "Depender apenas de sirenes",
        "Conversas rapidas sem registro",
        "Desligar os paineis durante o turno"
      )
    ]
  },
  "Trabalho em equipe acessivel": {
    title: "Atividade: Trabalho em equipe acessivel",
    description: "Perguntas sobre huddle visual, Libras e combinados do turno.",
    questions: [
      q(
        "O huddle de inicio de turno deve incluir:",
        "Pauta escrita, apoio em Libras e confirmacao visual de entendimento",
        "Somente conversa rapida sem registro",
        "Apenas e-mail enviado depois do turno",
        "Audio gravado sem legendas"
      ),
      q(
        "Por que a comunicacao em Libras importa no chao de fabrica?",
        "Garante que colaboradores surdos recebam a mesma informacao de seguranca",
        "Serve apenas para reunioes da diretoria",
        "Substitui a sinalizacao visual da planta",
        "E opcional quando ha muito ruido"
      ),
      q(
        "Para confirmar que a equipe entendeu o combinado, o lider deve:",
        "Pedir confirmacao visual e registrar o entendimento",
        "Assumir que todos ouviram",
        "Seguir em frente sem checagem",
        "Repetir a ordem somente por radio"
      ),
      q(
        "Qual pratica torna o turno mais inclusivo?",
        "Usar pauta visivel, gestos padronizados e canal de apoio em Libras",
        "Falar mais alto perto das maquinas",
        "Evitar escrever qualquer instrucao",
        "Deixar cada um inventar o proprio sinal"
      )
    ]
  },
  "Padrao ouro visual": {
    title: "Atividade: Qualidade e padronizacao",
    description: "Perguntas sobre conformidade, desvios, padrao e inspecao.",
    questions: [
      q(
        "O padrao ouro serve para:",
        "Comparar visualmente a peca produzida com a referencia aprovada",
        "Definir o salario da equipe",
        "Substituir o treinamento tecnico",
        "Esconder pecas com defeito"
      ),
      q(
        "Ao identificar um desvio, o operador deve:",
        "Sinalizar no painel e registrar a evidencia visual",
        "Continuar a producao e avisar no fim do mes",
        "Descartar a peca sem registro",
        "Misturar a peca com o lote conforme"
      ),
      q(
        "Procedimentos padronizados existem para:",
        "Reduzir retrabalho e manter o mesmo criterio entre turnos",
        "Deixar cada operador decidir o proprio metodo",
        "Acelerar a linha ignorando inspecao",
        "Evitar o uso de gabaritos"
      ),
      q(
        "Na inspecao de qualidade, o que e indispensavel?",
        "Iluminacao adequada, gabaritos e instrucoes visuais na bancada",
        "Avaliar a peca apenas de memoria",
        "Inspecionar sem registrar o resultado",
        "Aprovar o lote sem comparar com o padrao"
      )
    ]
  }
};

const FINAL_EXAMS = {
  "NR-12: Seguranca em Maquinas e Equipamentos": {
    title: "Avaliacao final NR-12",
    description: "Verifique os conhecimentos sobre protecoes, LOTO e procedimentos seguros.",
    questions: [
      q(
        "Antes de operar uma maquina, o colaborador deve:",
        "Verificar se as protecoes estao instaladas e o botao de emergencia visivel",
        "Remover protecoes para aumentar a produtividade",
        "Ignorar a sinalizacao se ja conhece o equipamento",
        "Ligar a maquina com a protecao aberta"
      ),
      q(
        "O procedimento de bloqueio e etiquetagem (LOTO) serve para:",
        "Evitar religamento acidental durante manutencao",
        "Acelerar a troca de turno",
        "Substituir o treinamento de seguranca",
        "Identificar a maquina mais antiga da linha"
      ),
      q(
        "O botao de emergencia deve estar:",
        "Visivel, acessivel e identificado",
        "Escondido para evitar acionamento acidental",
        "Disponivel apenas no escritorio",
        "Pintado da mesma cor da maquina, sem destaque"
      ),
      q(
        "Qual risco a NR-12 busca reduzir?",
        "Acidentes com partes moveis, energia e falta de protecao",
        "Atrasos de reuniao administrativa",
        "Falta de cafe no refeitorio",
        "Filas na portaria"
      ),
      q(
        "Qual recurso de acessibilidade e essencial neste treinamento?",
        "Legendas, Libras e conteudo visual claro",
        "Apenas audio sem texto",
        "Som ambiente em volume alto",
        "Instrucoes ditas uma unica vez"
      )
    ]
  },
  "Comunicacao Inclusiva no Chao de Fabrica": {
    title: "Avaliacao final de Comunicacao Inclusiva",
    description: "Confirme as praticas corretas de comunicacao no ambiente industrial.",
    questions: [
      q(
        "A melhor forma de passar uma instrucao urgente no chao de fabrica e:",
        "Sinal visual padronizado + mensagem escrita curta",
        "Apenas aviso verbal a distancia",
        "Assobio sem contexto",
        "Esperar o colaborador perceber sozinho"
      ),
      q(
        "O huddle de inicio de turno deve incluir:",
        "Pauta escrita, Libras e confirmacao visual",
        "Somente conversa rapida sem registro",
        "Apenas e-mail enviado apos o turno",
        "Audio sem legendas"
      ),
      q(
        "Sinalizacao visual consistente serve para:",
        "Garantir que a informacao chegue mesmo sem audio",
        "Decorar a planta com cores aleatorias",
        "Substituir o mapa de riscos da NR-12",
        "Reduzir a necessidade de EPI"
      ),
      q(
        "Acessibilidade no ambiente industrial significa:",
        "Informacoes criticas disponiveis em formato visual e em Libras",
        "Depender so de sirenes e buzinas",
        "Conversar mais alto",
        "Evitar paineis escritos"
      )
    ]
  },
  "Qualidade e Padronizacao de Processos": {
    title: "Avaliacao final de Qualidade",
    description: "Valide o entendimento sobre conformidade, desvios e inspecao.",
    questions: [
      q(
        "Ao identificar um desvio, o operador deve:",
        "Sinalizar no painel e registrar a evidencia visual",
        "Continuar a producao e avisar no fim do mes",
        "Descartar a peca sem registro",
        "Esconder a peca ate o fim do turno"
      ),
      q(
        "O padrao ouro serve para:",
        "Comparar visualmente a peca produzida com a referencia",
        "Substituir o treinamento tecnico",
        "Definir o salario da equipe",
        "Liberar pecas sem inspecao"
      ),
      q(
        "Um procedimento padronizado deve ser:",
        "Seguido da mesma forma em todos os turnos",
        "Adaptado por cada operador sem registro",
        "Ignorado quando a linha esta atrasada",
        "Guardado apenas no escritorio"
      ),
      q(
        "A inspecao de qualidade precisa de:",
        "Gabaritos, iluminacao adequada e registro do resultado",
        "Avaliacao apenas de memoria",
        "Aprovacao automatica de todo o lote",
        "Conferir so a primeira peca do mes"
      )
    ]
  }
};

function quizForModule(title) {
  if (MODULE_QUIZZES[title]) return MODULE_QUIZZES[title];
  const name = title || "este modulo";
  return {
    title: `Atividade: ${name}`,
    description: `Perguntas relacionadas ao conteudo de ${name}.`,
    questions: [
      q(
        `Qual e a pratica correta ao estudar ${name}?`,
        "Seguir o procedimento apresentado e confirmar o entendimento",
        "Ignorar as instrucoes visuais",
        "Pular a etapa sem registrar",
        "Inventar um metodo sem alinhamento"
      ),
      q(
        `Se houver duvida no conteudo de ${name}, o colaborador deve:`,
        "Consultar o material e acionar o lider ou a SST",
        "Seguir mesmo sem entender o risco",
        "Desligar os avisos visuais",
        "Deixar para o proximo mes"
      ),
      q(
        `As atividades de ${name} existem para:`,
        "Verificar se o conteudo da etapa foi compreendido",
        "Substituir o treinamento inteiro",
        "Liberar o certificado sem prova",
        "Aumentar a velocidade da linha"
      ),
      q(
        `Ao concluir ${name}, o proximo passo e:`,
        "Responder a atividade da etapa e so depois avancar",
        "Pular para o certificado",
        "Apagar o registro da etapa",
        "Operar sem confirmar o aprendizado"
      )
    ]
  };
}

module.exports = { MODULE_QUIZZES, FINAL_EXAMS, q, quizForModule };
