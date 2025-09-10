import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  userEmail: string;
  resetUrl: string;
  userName?: string;
}

export const PasswordResetEmail = ({
  userEmail,
  resetUrl,
  userName,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Redefinir sua senha do InteraSaúde</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <div style={logo}>
            ❤️ InteraSaúde
          </div>
        </Section>
        
        <Heading style={h1}>Redefinir Senha</Heading>
        
        <Text style={text}>
          Olá{userName ? ` ${userName}` : ''},
        </Text>
        
        <Text style={text}>
          Recebemos uma solicitação para redefinir a senha da sua conta ({userEmail}). 
          Clique no botão abaixo para criar uma nova senha:
        </Text>
        
        <Section style={buttonContainer}>
          <Link
            href={resetUrl}
            target="_blank"
            style={button}
          >
            Redefinir Senha
          </Link>
        </Section>
        
        <Text style={text}>
          Este link expira em 1 hora por motivos de segurança.
        </Text>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          Se você não solicitou esta redefinição de senha, pode ignorar este email com segurança. 
          Sua senha permanecerá inalterada.
        </Text>
        
        <Text style={footer}>
          Caso tenha problemas com o botão, copie e cole este link no seu navegador:<br />
          <Link href={resetUrl} style={link}>
            {resetUrl}
          </Link>
        </Text>
        
        <Text style={signature}>
          Atenciosamente,<br />
          Equipe InteraSaúde
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const logoSection = {
  padding: '32px',
  textAlign: 'center' as const,
}

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0066cc',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 32px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 32px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#0066cc',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: '200px',
  padding: '14px 20px',
}

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '0 32px',
}

const signature = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '32px 0 16px',
  padding: '0 32px',
}