const bcrypt = require("bcryptjs");
const db = require("./db");
const { maybeIssueCertificate } = require("../controllers/certificadoController");

function seed() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (count > 0) return;

  const hash = bcrypt.hashSync("123456", 10);

  const companyId = db
    .prepare(
      "INSERT INTO companies (name, cnpj, sector, city) VALUES (?, ?, ?, ?)"
    )
    .run("Nordeste Industrial S.A.", "12.345.678/0001-90", "Manufatura", "Recife").lastInsertRowid;

  db.prepare(
    `INSERT INTO users (company_id, name, email, password_hash, role, department, position, phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    companyId,
    "Marina Costa",
    "empresa@soundquest.com",
    hash,
    "company",
    "Recursos Humanos",
    "Gestora de Capacitacao",
    "(81) 98800-1100"
  );

  const collaborators = [
    ["Joao Almeida", "joao@soundquest.com", "Producao", "Operador de Linha"],
    ["Ana Beatriz Silva", "ana@soundquest.com", "Qualidade", "Analista de Qualidade"],
    ["Carlos Mendes", "carlos@soundquest.com", "Manutencao", "Tecnico de Manutencao"],
    ["Lucia Ferreira", "lucia@soundquest.com", "Seguranca", "Tecnica de SST"],
    ["Rafael Souza", "rafael@soundquest.com", "Logistica", "Operador de Empilhadeira"]
  ];

  const userIds = collaborators.map((c) =>
    db
      .prepare(
        `INSERT INTO users (company_id, name, email, password_hash, role, department, position)
         VALUES (?, ?, ?, ?, 'collaborator', ?, ?)`
      )
      .run(companyId, c[0], c[1], hash, c[2], c[3]).lastInsertRowid
  );

  const trainings = [
    {
      title: "NR-12: Seguranca em Maquinas e Equipamentos",
      description:
        "Capacitacao obrigatoria sobre protecoes, dispositivos de seguranca, bloqueio e procedimentos seguros de operacao em plantas industriais.",
      category: "Seguranca do Trabalho",
      duration: 90,
      level: "Intermediario",
      modules: [
        {
          title: "Fundamentos da NR-12",
          description: "Objetivo da norma e responsabilidades da empresa e do colaborador.",
          contents: [
            {
              title: "Por que a NR-12 existe",
              type: "text",
              body: "A NR-12 estabelece medidas de protecao para garantir a saude e a integridade fisica dos trabalhadores. Em ambientes industriais, o risco de acidentes com maquinas e elevado quando protecoes, sinalizacao e procedimentos nao estao claros.\n\nEste modulo apresenta os principios da norma em linguagem visual e acessivel, com apoio de legendas e interpretacao em Libras.",
              captions: "Texto principal com linguagem simples e termos tecnicos explicados.",
              libras_notes: "Interpretacao em Libras com sinais tecnicos de maquina, protecao e risco."
            },
            {
              title: "Mapa visual de riscos",
              type: "image",
              body: "Identifique zonas de risco, protecoes fixas e pontos de bloqueio na linha de producao.",
               media_url: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=1200&q=80",
               captions: "Imagem de planta industrial com areas de protecao destacadas.",
              libras_notes: "Intérprete descreve zonas vermelhas de risco e zonas verdes seguras."
            }
          ]
        },
        {
          title: "Dispositivos de protecao",
          description: "Protecoes fixas, moveis, sensores e comandos de emergencia.",
          contents: [
            {
              title: "Tipos de protecao",
              type: "text",
              body: "Protecoes fixas impedem o acesso a partes perigosas. Protecoes moveis devem estar associadas a intertravamentos. Comandos de emergencia precisam estar visiveis, acessiveis e identificados.\n\nSempre verifique se a protecao esta instalada antes de iniciar a operacao.",
              captions: "Lista visual: protecao fixa, protecao movel, botao de emergencia.",
              libras_notes: "Sinalizacao em Libras para botao de emergencia e intertravamento."
            },
            {
              title: "Procedimento visual de bloqueio",
              type: "image",
              body: "Consulte o infografico do procedimento de bloqueio e etiquetagem (LOTO). Siga cada etapa na ordem: desligar, bloquear, sinalizar e verificar a ausencia de energia.",
               media_url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80",
               captions: "1. Desligue a maquina. 2. Aplique o cadeado. 3. Sinalize. 4. Teste a ausencia de energia.",
              libras_notes: "Interpretacao em Libras dos quatro passos: desligar, aplicar cadeado, sinalizar e verificar ausencia de energia."
            }
          ]
        }
      ],
      activity: {
        title: "Avaliacao NR-12",
        description: "Verifique os conhecimentos sobre protecoes e procedimentos seguros.",
        questions: [
          {
            prompt: "Antes de operar uma maquina, o colaborador deve:",
            options: [
              ["Verificar se as protecoes estao instaladas e o botao de emergencia visivel", 1],
              ["Remover protecoes para aumentar a produtividade", 0],
              ["Ignorar a sinalizacao se ja conhece o equipamento", 0]
            ]
          },
          {
            prompt: "O procedimento de bloqueio e etiquetagem (LOTO) serve para:",
            options: [
              ["Evitar religamento acidental durante manutencao", 1],
              ["Acelerar a troca de turno", 0],
              ["Substituir o treinamento de seguranca", 0]
            ]
          },
          {
            prompt: "Qual recurso de acessibilidade e essencial neste treinamento?",
            options: [
              ["Legendas, Libras e conteudo visual claro", 1],
              ["Apenas audio sem texto", 0],
              ["Som ambiente em volume alto", 0]
            ]
          },
          {
            prompt: "O botao de emergencia deve estar:",
            options: [
              ["Visivel, acessivel e identificado", 1],
              ["Escondido para evitar acionamento acidental", 0],
              ["Disponivel apenas no escritorio", 0]
            ]
          },
          {
            prompt: "Protecoes moveis devem estar associadas a:",
            options: [
              ["Intertravamentos de seguranca", 1],
              ["Aumento de velocidade da linha", 0],
              ["Remocao temporaria sem registro", 0]
            ]
          }
        ]
      }
    },
    {
      title: "Comunicacao Inclusiva no Chao de Fabrica",
      description:
        "Praticas de comunicacao visual, sinalizacao e rotinas de trabalho acessiveis para equipes com colaboradores surdos.",
      category: "Inclusao e Comunicacao",
      duration: 60,
      level: "Basico",
      modules: [
        {
          title: "Comunicacao visual efetiva",
          description: "Sinalizacao, gestos padronizados e paineis visuais.",
          contents: [
            {
              title: "Padroes visuais de sinalizacao",
              type: "text",
              body: "No chao de fabrica, a comunicacao precisa ser imediata. Cores, paineis, luminosos e gestos padronizados reduzem falhas e aumentam a seguranca de todos, especialmente de pessoas com deficiencia auditiva.\n\nAdote sinais visuais consistentes para partida, parada, risco e apoio.",
              captions: "Use verde para seguir, amarelo para atencao e vermelho para parar.",
              libras_notes: "Interpretacao em Libras com sinais de atencao, parada e apoio."
            },
            {
              title: "Painel de rotina acessivel",
              type: "image",
              body: "Exemplo de quadro de tarefas com icones, horarios e status visuais.",
               media_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
               captions: "Quadro com icones de tarefa, responsavel e status.",
              libras_notes: "Intérprete explica cada icone do quadro."
            }
          ]
        },
        {
          title: "Trabalho em equipe acessivel",
          description: "Como lideres e pares devem se comunicar no turno.",
          contents: [
            {
              title: "Rotina de huddle visual",
              type: "libras",
              body: "Reuniao de inicio de turno com interpretacao em Libras, pauta escrita e confirmacao visual de entendimento.",
              media_url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
              captions: "Pauta: metas, riscos, apoios e canais de comunicacao.",
              libras_notes: "Conteudo principal em Libras com legendas sincronizadas."
            }
          ]
        }
      ],
      activity: {
        title: "Avaliacao de Comunicacao Inclusiva",
        description: "Confirme as praticas corretas de comunicacao no ambiente industrial.",
        questions: [
          {
            prompt: "A melhor forma de passar uma instrucao urgente no chao de fabrica e:",
            options: [
              ["Sinal visual padronizado + mensagem escrita curta", 1],
              ["Apenas aviso verbal a distancia", 0],
              ["Assobio sem contexto", 0]
            ]
          },
          {
            prompt: "O huddle de inicio de turno deve incluir:",
            options: [
              ["Pauta escrita, Libras e confirmacao visual", 1],
              ["Somente conversa rapida sem registro", 0],
              ["Apenas e-mail enviado apos o turno", 0]
            ]
          }
        ]
      }
    },
    {
      title: "Qualidade e Padronizacao de Processos",
      description:
        "Controle visual de qualidade, inspeção por evidencias e registros acessiveis para operadores.",
      category: "Qualidade",
      duration: 75,
      level: "Intermediario",
      modules: [
        {
          title: "Padrao ouro visual",
          description: "Como identificar peca conforme e nao conforme.",
          contents: [
            {
              title: "Criterios de conformidade",
              type: "text",
              body: "A padronizacao reduz retrabalho. Compare sempre a peca com o padrao ouro fotografico. Qualquer desvio de medida, acabamento ou montagem deve ser sinalizado no painel de qualidade.",
              captions: "Conforme = verde. Nao conforme = vermelho. Em analise = amarelo.",
              libras_notes: "Intérprete mostra exemplos de peca conforme e nao conforme."
            },
            {
              title: "Estacao de inspecao",
              type: "image",
              body: "Layout acessivel da bancada de inspecao com iluminacao adequada e instrucoes visuais.",
              media_url: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=1200&q=80",
              captions: "Bancada organizada com gabaritos e cartoes visuais.",
              libras_notes: "Descricao em Libras do fluxo de inspecao."
            }
          ]
        }
      ],
      activity: {
        title: "Avaliacao de Qualidade",
        description: "Valide o entendimento sobre conformidade e registros.",
        questions: [
          {
            prompt: "Ao identificar um desvio, o operador deve:",
            options: [
              ["Sinalizar no painel e registrar a evidencia visual", 1],
              ["Continuar a producao e avisar no fim do mes", 0],
              ["Descartar a peca sem registro", 0]
            ]
          },
          {
            prompt: "O padrao ouro serve para:",
            options: [
              ["Comparar visualmente a peca produzida com o referencia", 1],
              ["Substituir o treinamento tecnico", 0],
              ["Definir o salario da equipe", 0]
            ]
          }
        ]
      }
    }
  ];

  const insertTraining = db.prepare(
    `INSERT INTO trainings (company_id, title, description, category, duration_minutes, level, thumbnail, status, required)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 1)`
  );
  const insertModule = db.prepare(
    `INSERT INTO modules (training_id, title, description, order_index) VALUES (?, ?, ?, ?)`
  );
  const insertContent = db.prepare(
    `INSERT INTO contents (module_id, title, type, body, media_url, captions, libras_notes, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertActivity = db.prepare(
    `INSERT INTO activities (training_id, title, description, passing_score) VALUES (?, ?, ?, 70)`
  );
  const insertQuestion = db.prepare(
    `INSERT INTO questions (activity_id, prompt, order_index) VALUES (?, ?, ?)`
  );
  const insertOption = db.prepare(
    `INSERT INTO options (question_id, label, is_correct) VALUES (?, ?, ?)`
  );

  const trainingIds = [];
  trainings.forEach((t, ti) => {
    const thumbs = [
      "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=900&q=80"
    ];
    const tid = insertTraining.run(
      companyId,
      t.title,
      t.description,
      t.category,
      t.duration,
      t.level,
      thumbs[ti]
    ).lastInsertRowid;
    trainingIds.push(tid);

    t.modules.forEach((m, mi) => {
      const mid = insertModule.run(tid, m.title, m.description, mi).lastInsertRowid;
      m.contents.forEach((c, ci) => {
        insertContent.run(
          mid,
          c.title,
          c.type,
          c.body,
          c.media_url || null,
          c.captions || null,
          c.libras_notes || null,
          ci
        );
      });
    });

    const aid = insertActivity.run(tid, t.activity.title, t.activity.description).lastInsertRowid;
    t.activity.questions.forEach((q, qi) => {
      const qid = insertQuestion.run(aid, q.prompt, qi).lastInsertRowid;
      q.options.forEach((o) => insertOption.run(qid, o[0], o[1]));
    });
  });

  const enroll = db.prepare(
    "INSERT INTO enrollments (user_id, training_id, status, progress) VALUES (?, ?, ?, ?)"
  );
  const markContent = db.prepare(
    "INSERT INTO content_progress (user_id, content_id, completed, completed_at) VALUES (?, ?, 1, datetime('now'))"
  );
  const insertAttempt = db.prepare(
    "INSERT INTO attempts (user_id, activity_id, score, passed, answers) VALUES (?, ?, ?, ?, ?)"
  );

  const allContents = db.prepare("SELECT id, module_id FROM contents").all();
  const modulesByTraining = db.prepare("SELECT id, training_id FROM modules").all();

  userIds.forEach((uid, idx) => {
    trainingIds.forEach((tid, tIndex) => {
      if (idx === 0 && tIndex > 1) return;
      if (idx === 4 && tIndex === 0) return;

      let progress = 35 + ((idx + tIndex) * 17) % 65;
      if (idx === 1 && tIndex === 0) progress = 90;
      if (idx === 3 && tIndex === 1) progress = 90;
      enroll.run(uid, tid, "in_progress", Math.min(progress, 90));

      const tModules = modulesByTraining.filter((m) => m.training_id === tid).map((m) => m.id);
      const tContents = allContents.filter((c) => tModules.includes(c.module_id));
      const shouldFinishModules = (idx === 1 && tIndex === 0) || (idx === 3 && tIndex === 1);
      const doneCount = shouldFinishModules ? tContents.length : Math.round((Math.min(progress, 90) / 100) * tContents.length);
      tContents.slice(0, doneCount).forEach((c) => {
        try {
          markContent.run(uid, c.id);
        } catch {
          /* ignore unique */
        }
      });

      if (idx === 1 && tIndex === 0) {
        const activity = db.prepare("SELECT id FROM activities WHERE training_id = ?").get(tid);
        insertAttempt.run(uid, activity.id, 90, 1, JSON.stringify({ demo: true }));
      }
      if (idx === 3 && tIndex === 1) {
        const activity = db.prepare("SELECT id FROM activities WHERE training_id = ?").get(tid);
        insertAttempt.run(uid, activity.id, 85, 1, JSON.stringify({ demo: true }));
      }
    });
  });

  db.prepare("SELECT user_id, training_id FROM enrollments").all().forEach((row) => {
    maybeIssueCertificate(row.user_id, row.training_id);
  });
}

function repair() {
  try {
    db.exec("ALTER TABLE trainings ADD COLUMN required INTEGER DEFAULT 1");
  } catch {
    /* already exists */
  }
  db.prepare("UPDATE trainings SET required = 1 WHERE required IS NULL").run();
  db.prepare("SELECT user_id, training_id FROM enrollments").all().forEach((row) => {
    maybeIssueCertificate(row.user_id, row.training_id);
  });
}

seed();
repair();
module.exports = { seed, repair };
