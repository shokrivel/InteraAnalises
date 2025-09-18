"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, User, Copy, CheckCheck, Paperclip, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import HealthcareProvidersMap from "./HealthcareProvidersMap";

interface ConsultationResponse {
  response: string;
  consultationId?: string;
  suggestedSpecialty?: string;
}

interface Profile {
  name: string;
  profile_type: string;
  address?: string;
  city?: string;
}

export default function ConsultationChat({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [consultationResponse, setConsultationResponse] = useState<ConsultationResponse | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch(`/api/profile?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    setLoading(true);
    setConsultationResponse(null);

    try {
      const res = await fetch("/functions/v1/gemini-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          consultationData: { text: userMessage },
          attachments: attachments.map((file) => file.name),
        }),
      });

      const data = await res.json();
      setConsultationResponse(data);
      setShowMap(true);
    } catch (err) {
      console.error("Erro na consulta:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!consultationResponse?.response) return;
    navigator.clipboard.writeText(consultationResponse.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-6">
      {/* Chat Messages */}
      <div className="space-y-4">
        {/* User Message */}
        {userMessage && (
          <div className="flex items-start space-x-3">
            <Avatar>
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="flex-1">
              <CardContent className="pt-4">
                <p>{userMessage}</p>
                {attachments.length > 0 && (
                  <ul className="mt-2 text-sm text-muted-foreground">
                    {attachments.map((file, idx) => (
                      <li key={idx}>📎 {file.name}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Response */}
        {consultationResponse && (
          <div className="flex items-start space-x-3">
            <Avatar>
              <AvatarFallback>
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="flex-1">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">InteraSaúde AI</span>
                      <Badge variant="secondary" className="text-xs">
                        Gemini 2.5 Pro
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? "Copiado" : "Copiar"}</span>
                    </Button>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    {consultationResponse.response
                      .split(/(?=\d\.)/) // separa blocos numerados
                      .map((section, i) => (
                        <p key={i} className="mb-3 leading-relaxed">
                          {section.trim()}
                        </p>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Healthcare Providers Map */}
        {showMap && profile && consultationResponse?.suggestedSpecialty && (
          <Card>
            <CardContent className="p-6">
              <HealthcareProvidersMap
                userAddress={
                  profile.address && profile.city ? `${profile.address}, ${profile.city}` : undefined
                }
                keyword={consultationResponse.suggestedSpecialty}
                onClose={() => setShowMap(false)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Descreva seus sintomas..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          disabled={loading}
        />
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleAttachmentChange}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Analisando..." : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}
