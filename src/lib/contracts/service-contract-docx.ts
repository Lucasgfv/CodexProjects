import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

import {
  serviceProvider,
  type ServiceContractData,
} from "@/lib/contracts/service-contract";

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function run(
  text: string,
  options: {
    size?: number;
    bold?: boolean;
    italics?: boolean;
    color?: string;
    break?: number;
  } = {},
) {
  return new TextRun({
    text,
    font: "Arial",
    size: options.size ?? 19,
    bold: options.bold,
    italics: options.italics,
    color: options.color ?? "202A35",
    break: options.break,
  });
}

function body(
  children: string | TextRun[],
  options: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    noIndent?: boolean;
    after?: number;
    before?: number;
    keepNext?: boolean;
  } = {},
) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [run(children)],
    alignment: options.alignment ?? AlignmentType.JUSTIFIED,
    indent: options.noIndent ? undefined : { firstLine: 709 },
    spacing: {
      line: 240,
      after: options.after ?? 70,
      before: options.before ?? 0,
    },
    keepNext: options.keepNext,
  });
}

function clause(text: string) {
  return new Paragraph({
    children: [run(text, { bold: true, size: 21, color: "09294A" })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 100, after: 50, line: 240 },
    keepNext: true,
  });
}

function title(text: string) {
  return new Paragraph({
    children: [run(text, { bold: true, size: 24, color: "09294A" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 140 },
    keepNext: true,
  });
}

function singleLine(label: string, text: string) {
  return body([run(label, { bold: true }), run(text)], { noIndent: true });
}

function paragraphUnique(text: string) {
  return body([run("Parágrafo único. ", { italics: true }), run(text)]);
}

function signatureCell(signature?: { name: string; role: string }) {
  if (!signature) {
    return new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: noBorders,
      children: [new Paragraph({ children: [] })],
    });
  }
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.BOTTOM,
    borders: noBorders,
    margins: { top: 0, bottom: 40, left: 140, right: 140 },
    children: [
      new Paragraph({
        border: {
          bottom: {
            color: "334155",
            style: BorderStyle.SINGLE,
            size: 8,
            space: 1,
          },
        },
        spacing: { before: 180, after: 40 },
        keepNext: true,
        children: [run(" ", { size: 2 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [
          run(signature.name.toUpperCase(), { bold: true, size: 18 }),
          run(` (${signature.role})`, { size: 17 }),
        ],
      }),
    ],
  });
}

function signatureTable(signatures: Array<{ name: string; role: string }>) {
  const rows: TableRow[] = [];
  for (let index = 0; index < signatures.length; index += 2) {
    rows.push(
      new TableRow({
        cantSplit: true,
        children: [
          signatureCell(signatures[index]),
          signatureCell(signatures[index + 1]),
        ],
      }),
    );
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows,
  });
}

async function buildHeader() {
  const logoResponse = await fetch("/autcontabil-logo.jpg");
  if (!logoResponse.ok) {
    throw new Error("Não foi possível carregar a marca da AUTCONTÁBIL.");
  }
  const logo = new Uint8Array(await logoResponse.arrayBuffer());

  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 19, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: "09294A", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 0 },
                    children: [
                      new ImageRun({
                        data: logo,
                        type: "jpg",
                        transformation: { width: 58, height: 58 },
                        altText: {
                          title: "AUTCONTÁBIL",
                          description: "Marca AUTCONTÁBIL",
                          name: "Logo AUTCONTÁBIL",
                        },
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 81, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: "09294A", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 160, right: 140 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 30 },
                    children: [
                      run(serviceProvider.company, {
                        bold: true,
                        size: 28,
                        color: "FFFFFF",
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 15 },
                    children: [
                      run(
                        `CNPJ: ${serviceProvider.cnpj}  |  CRC/MG: ${serviceProvider.crc}`,
                        { size: 18, color: "DFF5EE" },
                      ),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 0 },
                    children: [
                      run(
                        `Rua Mato Grosso, 70 - Unaí/MG  |  Tel: ${serviceProvider.phone}  |  ${serviceProvider.email}`,
                        { size: 17, color: "E7EEF5" },
                      ),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({
        border: {
          bottom: {
            color: "F47A20",
            style: BorderStyle.SINGLE,
            size: 12,
            space: 2,
          },
        },
        spacing: { after: 50 },
        children: [],
      }),
    ],
  });
}

function buildFooter() {
  return new Footer({
    children: [
      new Paragraph({
        border: {
          top: {
            color: "07866F",
            style: BorderStyle.SINGLE,
            size: 8,
            space: 5,
          },
        },
        alignment: AlignmentType.CENTER,
        spacing: { before: 45, after: 0 },
        children: [
          run(
            `Rua Mato Grosso, 70, Bairro Primavera, CEP 38612-116, Unaí/MG | Fone: ${serviceProvider.formattedPhone} | E-mail: ${serviceProvider.email}`,
            { size: 17, color: "475569" },
          ),
        ],
      }),
    ],
  });
}

export async function createServiceContractBlob(data: ServiceContractData) {
  const partnerDescriptions = data.partners.map((partner, index) =>
    body(
      [
        run(`${index + 1}. ${partner.name}`, { bold: true }),
        run(
          `, ${partner.nationality}, ${partner.civilStatus}, ${partner.profession}, inscrito(a) no CPF nº ${partner.cpf}, RG nº ${partner.rg}, órgão emissor ${partner.issuer}, residente e domiciliado(a) na ${partner.address}${index === data.partners.length - 1 ? "." : ";"}`,
        ),
      ],
      { noIndent: true },
    ),
  );

  const contractSignatures = [
    { name: serviceProvider.company, role: "CONTRATADA" },
    ...data.partners.map((partner) => ({
      name: partner.name,
      role: "SÓCIO(A) / REPRESENTANTE",
    })),
  ];
  const powerSignatures = data.partners.map((partner) => ({
    name: partner.name,
    role: "OUTORGANTE / REPRESENTANTE",
  }));

  const contractChildren = [
    title("CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS"),
    body(
      "Pelo presente instrumento particular de Contrato de Prestação de Serviços Contábeis, de um lado:",
    ),
    singleLine(
      "CONTRATADA: ",
      `${serviceProvider.company}, pessoa jurídica de direito privado, inscrita no CNPJ nº ${serviceProvider.cnpj}, com sede na ${serviceProvider.address}, inscrita no CRC/MG sob nº ${serviceProvider.crc}, neste ato representada por seu sócio e responsável técnico ${serviceProvider.technician}, brasileiro, contador, inscrito no CRC/MG sob nº ${serviceProvider.technicianCrc}.`,
    ),
    body("e, de outro lado:", { noIndent: true }),
    singleLine(
      "CONTRATANTE: ",
      `${data.company}, inscrita no CNPJ nº ${data.cnpj}, com endereço na ${data.address}, neste ato representada por seu(s) sócio(s):`,
    ),
    ...partnerDescriptions,
    body(
      "têm entre si justo e contratado o que segue, nos termos da Resolução CFC nº 1.590/2020 e demais normas aplicáveis.",
    ),
    clause("CLÁUSULA 1ª - DO OBJETO"),
    body(
      "O presente contrato tem por objeto a prestação de serviços contábeis, fiscais e de departamento pessoal, conforme especificado no Anexo I, observadas as normas brasileiras de contabilidade e a legislação vigente.",
    ),
    clause("CLÁUSULA 2ª - DAS OBRIGAÇÕES DA CONTRATANTE"),
    body(
      "É de responsabilidade exclusiva da CONTRATANTE fornecer, de forma completa, correta e tempestiva, todos os documentos, informações e dados necessários à execução dos serviços, inclusive certificado digital dentro da validade.",
    ),
    paragraphUnique(
      "A CONTRATADA não se responsabiliza pela idoneidade, veracidade ou exatidão dos documentos e informações fornecidos pela CONTRATANTE.",
    ),
    clause("CLÁUSULA 3ª - DOS HONORÁRIOS"),
    body(
      `Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA honorários mensais no valor de R$ ${data.feeNumber} (${data.feeWords}), com vencimento todo dia 10 de cada mês.`,
    ),
    clause("CLÁUSULA 4ª - DOS SERVIÇOS NÃO INCLUSOS"),
    body(
      "Não estão incluídos nos honorários mensais os serviços extraordinários ou complementares, tais como: Imposto de Renda Pessoa Física, participação em licitações, defesas fiscais, recálculos decorrentes de informações retificadas, atendimentos extraordinários e outros serviços não previstos no objeto principal, os quais serão cobrados à parte, conforme tabela do sindicato da categoria ou orçamento específico.",
    ),
    clause(
      "CLÁUSULA 5ª - DO REAJUSTE E DO REEQUILÍBRIO ECONÔMICO-FINANCEIRO",
    ),
    body(
      "Os honorários poderão ser reajustados anualmente com base na variação do INPC acrescido de 3% (três por cento), ou por outro índice que venha a substituí-lo.",
    ),
    paragraphUnique(
      "Os honorários poderão ser revistos a qualquer tempo caso haja aumento significativo da carga tributária, criação ou ampliação de obrigações acessórias, alterações legislativas ou normativas que impliquem aumento relevante no volume, complexidade ou responsabilidade dos serviços prestados, mediante comunicação prévia e justificativa técnica.",
    ),
    clause("CLÁUSULA 6ª - DA INADIMPLÊNCIA E SUSPENSÃO DOS SERVIÇOS"),
    body(
      "Em caso de atraso no pagamento, incidirá multa de 5% (cinco por cento) sobre o valor devido, acrescida de juros de 2% (dois por cento) ao mês.",
    ),
    paragraphUnique(
      "Persistindo a inadimplência por prazo superior a 30 (trinta) dias, a CONTRATADA poderá suspender a prestação dos serviços, sem prejuízo da cobrança dos valores devidos.",
    ),
    clause("CLÁUSULA 7ª - DA FIDELIDADE CONTRATUAL"),
    body(
      "O presente contrato é celebrado com prazo mínimo de fidelidade de 12 (doze) meses, contados a partir da data de sua assinatura.",
    ),
    paragraphUnique(
      "A rescisão imotivada por iniciativa da CONTRATANTE antes do término do prazo de fidelidade implicará no pagamento de multa compensatória equivalente a 30% do restante dos honorários à época da rescisão.",
    ),
    clause("CLÁUSULA 8ª - DA RESCISÃO APÓS A FIDELIDADE"),
    body(
      "Após o cumprimento do prazo mínimo de fidelidade, o contrato passará a vigorar por prazo indeterminado, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.",
    ),
    clause("CLÁUSULA 9ª - DA RESPONSABILIDADE"),
    body(
      "A CONTRATADA não se responsabiliza por multas, juros ou penalidades decorrentes do envio intempestivo, incorreto ou incompleto de informações por parte da CONTRATANTE.",
    ),
    paragraphUnique(
      "A responsabilidade da CONTRATADA fica limitada ao valor total dos honorários pagos nos últimos 12 (doze) meses.",
    ),
    clause("CLÁUSULA 10ª - DA PROTEÇÃO DE DADOS (LGPD)"),
    body(
      "A CONTRATADA compromete-se a tratar os dados pessoais da CONTRATANTE em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD), observando os princípios da finalidade, adequação, segurança e confidencialidade.",
    ),
    clause("CLÁUSULA 11ª - DO FORO"),
    body(
      "Fica eleito o foro da Comarca de Unaí/MG para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.",
    ),
    body(
      "E, por estarem justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor.",
    ),
    body(`Unaí/MG, ${data.date}.`, {
      noIndent: true,
      alignment: AlignmentType.RIGHT,
      before: 60,
    }),
    signatureTable(contractSignatures),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const namesAndCpfs = data.partners
    .map((partner) => `${partner.name}, CPF nº ${partner.cpf}`)
    .join("; ");
  const powerChildren = [
    title("PROCURAÇÃO"),
    singleLine(
      "OUTORGANTE: ",
      `${data.company}, portadora do CNPJ ${data.cnpj}, representada por seu(s) sócio(s) ${namesAndCpfs}, com endereço em ${data.address}.`,
    ),
    singleLine(
      "OUTORGADO: ",
      `${serviceProvider.company}, inscrita no CNPJ ${serviceProvider.cnpj}, registro CRC/MG ${serviceProvider.crc}, com endereço na Rua Mato Grosso, 70, Bairro Primavera, Unaí (MG).`,
    ),
    singleLine(
      "PODERES: ",
      `Representar o outorgante ${data.company}, CNPJ ${data.cnpj}, com o objetivo de tratar de qualquer assunto de seu interesse relativamente à Secretaria Estadual de Fazenda e Receita Federal do Brasil, podendo para tanto, prestar declarações; assinar requerimentos, petições e termo de responsabilidade e compromisso municipal, estadual e federal; solicitar a expedição de guias para pagamento e/ou retirá-las; tomar ciência de decisões e despachos; retirar documentos; apresentar impugnação a qualquer decisão; receber citações ou intimações e/ou dar-se por citado ou intimado perante a administração pública municipal, estadual e/ou federal.`,
    ),
    body(`Unaí-MG, ${data.date}.`, {
      noIndent: true,
      alignment: AlignmentType.RIGHT,
      before: 80,
    }),
    signatureTable(powerSignatures),
  ];

  const document = new Document({
    creator: serviceProvider.company,
    title: `Contrato de Prestação de Serviços Contábeis - ${data.company}`,
    description: "Contrato de prestação de serviços contábeis e procuração.",
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 19, color: "202A35" },
          paragraph: { spacing: { line: 240, after: 70 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: 1417,
              right: 1417,
              bottom: 1417,
              left: 1417,
              header: 284,
              footer: 425,
            },
          },
        },
        headers: { default: await buildHeader() },
        footers: { default: buildFooter() },
        children: [...contractChildren, ...powerChildren],
      },
    ],
  });

  return Packer.toBlob(document);
}
