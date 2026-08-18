import { Resend } from "resend";
import { buildInviteEmail } from "@/lib/emails/invite-template";

export const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || "MarkLabs <onboarding@resend.dev>";

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY não configurada. Configure em .env.local: https://resend.com"
    );
  }
  return new Resend(apiKey);
};

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailTemplate) {
  const resend = getResend();
  return resend.emails.send({
    from: DEFAULT_FROM_EMAIL,
    to,
    subject,
    html,
  });
}

/**
 * Enviar email de boas-vindas após cadastro
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  activationLink: string
) {
  return sendEmail({
    to: email,
    subject: "🎉 Bem-vindo ao MarkLabs! Seu gerenciador de redes sociais",
    html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
              .header { background: linear-gradient(135deg, #ea580c, #c2410c); color: white; padding: 30px; text-align: center; border-radius: 10px; }
              .content { background: white; padding: 30px; margin-top: 20px; border-radius: 10px; }
              .button { display: inline-block; background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
              .features { margin-top: 30px; padding-top: 30px; border-top: 1px solid #eee; }
              .feature { margin: 15px 0; }
              .feature strong { color: #ea580c; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Bem-vindo ao MarkLabs!</h1>
                <p>Seu gerenciador de redes sociais está pronto</p>
              </div>

              <div class="content">
                <h2>Olá ${name},</h2>
                
                <p>Obrigado por se cadastrar no <strong>MarkLabs</strong>! Estamos felizes em tê-lo conosco.</p>

                <h3>🚀 Como Começar</h3>
                <ol>
                  <li><strong>Conecte suas redes sociais</strong> (Facebook, Instagram, LinkedIn)</li>
                  <li><strong>Crie seus primeiros posts</strong> usando o Composer</li>
                  <li><strong>Agende publicações</strong> para suas contas</li>
                  <li><strong>Acompanhe métricas</strong> em tempo real no Dashboard</li>
                </ol>

                <div class="features">
                  <h3>✨ Principais Recursos</h3>
                  <div class="feature">
                    <strong>📱 Composer</strong> - Escreva posts para múltiplas redes ao mesmo tempo
                  </div>
                  <div class="feature">
                    <strong>📅 Calendário Editorial</strong> - Visualize e gerencie seus posts agendados
                  </div>
                  <div class="feature">
                    <strong>📊 Dashboard</strong> - Acompanhe seu desempenho em tempo real
                  </div>
                  <div class="feature">
                    <strong>📈 Analytics</strong> - Análises detalhadas de suas redes sociais
                  </div>
                </div>

                <div style="text-align: center;">
                  <a href="${activationLink}" class="button">Ir para o Dashboard</a>
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <strong>Dúvidas?</strong><br>
                  Visite nossa <a href="https://docs.marklabs.com" style="color: #ea580c;">documentação</a> ou 
                  <a href="mailto:support@marklabs.com" style="color: #ea580c;">entre em contato conosco</a>.
                </p>
              </div>

              <div class="footer">
                <p>MarkLabs © 2026. Todos os direitos reservados.</p>
                <p>Você recebeu este email porque se cadastrou no MarkLabs.</p>
              </div>
            </div>
          </body>
        </html>
      `,
  });
}

/**
 * Enviar email de recuperação de senha
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
) {
  return sendEmail({
    to: email,
    subject: "🔐 Recuperação de Senha - MarkLabs",
    html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
              .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px; }
              .content { background: white; padding: 30px; margin-top: 20px; border-radius: 10px; }
              .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Recuperação de Senha</h1>
              </div>

              <div class="content">
                <h2>Olá ${name},</h2>
                
                <p>Recebemos uma solicitação para redefinir sua senha do MarkLabs.</p>

                <div class="warning">
                  ⚠️ <strong>Segurança:</strong> Este link expira em 24 horas. Se você não solicitou esta alteração, ignore este email.
                </div>

                <h3>Redefinir Sua Senha</h3>
                <p>Clique no botão abaixo para criar uma nova senha:</p>

                <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Redefinir Senha</a>
                </div>

                <p style="margin-top: 30px; color: #888; font-size: 14px;">
                  <strong>Link direto:</strong><br>
                  <code>${resetLink}</code>
                </p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; background: #f0f9ff; padding: 15px; border-radius: 6px;">
                  <strong>💡 Dicas de Segurança:</strong>
                  <ul>
                    <li>Use uma senha forte com letras, números e símbolos</li>
                    <li>Nunca compartilhe sua senha com ninguém</li>
                    <li>Se não reconhece essa atividade, mude sua senha imediatamente</li>
                  </ul>
                </div>

                <p style="margin-top: 20px;">
                  <strong>Não consegue clicar?</strong><br>
                  Copie e cole este link no seu navegador:<br>
                  <code>${resetLink}</code>
                </p>
              </div>

              <div class="footer">
                <p>MarkLabs © 2026. Todos os direitos reservados.</p>
                <p>Este é um email automático de segurança. Não responda este email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
  });
}

/**
 * Enviar alerta de falha de publicação
 */
export async function sendPublishErrorAlert(
  email: string,
  name: string,
  postTitle: string,
  errorMessage: string,
  supportLink: string
) {
  return sendEmail({
    to: email,
    subject: "⚠️ Falha ao Publicar Post - MarkLabs",
    html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
              .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px; }
              .content { background: white; padding: 30px; margin-top: 20px; border-radius: 10px; }
              .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Falha ao Publicar</h1>
              </div>

              <div class="content">
                <h2>Olá ${name},</h2>
                
                <p>Infelizmente, ocorreu um erro ao publicar seu post:</p>

                <div class="error-box">
                  <strong>Post:</strong> ${postTitle}<br>
                  <strong>Erro:</strong> ${errorMessage}
                </div>

                <h3>O que fazer?</h3>
                <ol>
                  <li>Verifique sua conexão com a rede social</li>
                  <li>Tente publicar novamente em algumas horas</li>
                  <li>Se o problema persistir, <a href="${supportLink}">entre em contato com nosso suporte</a></li>
                </ol>

                <div style="text-align: center;">
                  <a href="https://marklabs.com/dashboard" class="button">Ir para Dashboard</a>
                </div>
              </div>

              <div class="footer">
                <p>MarkLabs © 2026. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
  });
}

export async function sendTeamInviteEmail(
  email: string,
  teamName: string,
  inviterName: string,
  role: string,
  inviteUrl: string
) {
  return sendEmail({
    to: email,
    subject: `${inviterName} te convidou para a equipe ${teamName} no MarkLabs`,
    html: buildInviteEmail({ teamName, inviterName, role, inviteUrl }),
  });
}
