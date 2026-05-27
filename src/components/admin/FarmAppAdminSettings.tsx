import{useState,useEffect,useRef}from "react";
import{Button}from "@/components/ui/button";
import{Card,CardContent,CardDescription,CardHeader,CardTitle}from "@/components/ui/card";
import{Input}from "@/components/ui/input";
import{Label}from "@/components/ui/label";
import{Badge}from "@/components/ui/badge";
import{Tabs,TabsContent,TabsList,TabsTrigger}from "@/components/ui/tabs";
import{Switch}from "@/components/ui/switch";
import{Select,SelectContent,SelectItem,SelectTrigger,SelectValue}from "@/components/ui/select";
import{Save,RefreshCw,Users,DollarSign,MessageSquare,Settings2,Plus,UserCheck,AlertTriangle}from "lucide-react";
import{useToast}from "@/hooks/use-toast";
import{createClient,SupabaseClient}from "@supabase/supabase-js";

const FARMAPP_URL ="https://rickfgexujrxbfcyfcfw.supabase.co";
// IMPORTANTE: a chave é criada de forma lazy dentro do componente
// para evitar crash no módulo quando VITE_FARMAPP_SUPABASE_ANON_KEY não estiver definida

interface Attendant{id:string;display_name:string;email:string;role:string;is_online:boolean;is_active:boolean}
interface QueueItem{session_id:string;patient_name:string;session_title:string;status:string;wait_minutes:number;attendant_name:string;message_count:number}

export default function FarmAppAdminSettings(){
  const{toast}=useToast();
  const clientRef=useRef<SupabaseClient|null>(null);
  const[ready,setReady]=useState(false);
  const[missingKey,setMissingKey]=useState(false);
  const[loading,setLoading]=useState(false);
  const[settings,setSettings]=useState<Record<string,string>>({});
  const[attendants,setAttendants]=useState<Attendant[]>([]);
  const[queue,setQueue]=useState<QueueItem[]>([]);
  const[newAtt,setNewAtt]=useState({name:"",email:"",role:"attendant"});
  const[showAdd,setShowAdd]=useState(false);
  const[saving,setSaving]=useState<string|null>(null);

  // Cria o cliente Supabase de forma lazy (só no browser, só quando o componente monta)
  useEffect(()=>{
    const key=import.meta.env.VITE_FARMAPP_SUPABASE_ANON_KEY||""
    if(!key){
      setMissingKey(true);
      return;
    }
    try{
      clientRef.current=createClient(FARMAPP_URL,key);
      setReady(true);
    }catch(e){
      console.error("FarmApp client init failed:",e);
      setMissingKey(true);
    }
  },[]);

  const fc=()=>clientRef.current;

  const loadAll=async()=>{
    if(!fc())return;
    setLoading(true);
    const[s,a,q]=await Promise.all([
      fc()!.rpc("get_public_settings"),
      fc()!.from("chat_attendants").select("*").order("created_at"),
      fc()!.rpc("get_chat_queue"),
    ]);
    if(s.data){const m:Record<string,string>={};(s.data as any[]).forEach(r=>{m[r.key]=r.value;});setSettings(m);}
    setAttendants((a.data||[])as Attendant[]);
    setQueue((q.data||[])as QueueItem[]);
    setLoading(false);
  };

  useEffect(()=>{if(ready)loadAll();},[ready]);

  const saveSetting=async(key:string,value:string)=>{
    if(!fc())return;
    setSaving(key);
    const{error}=await fc()!.rpc("admin_set_setting",{p_key:key,p_value:value});
    setSaving(null);
    if(error)toast({title:"Erro",description:error.message,variant:"destructive"});
    else{toast({title:"\u2713 Salvo"});setSettings(p=>({...p,[key]:value}));}
  };

  const saveMultiple=async(keys:string[])=>{
    if(!fc())return;
    setLoading(true);
    for(const k of keys)await fc()!.rpc("admin_set_setting",{p_key:k,p_value:settings[k]||""});
    setLoading(false);
    toast({title:"\u2713 Configura\u00e7\u00f5es salvas"});
  };

  const addAttendant=async()=>{
    if(!fc())return;
    if(!newAtt.name.trim()||!newAtt.email.trim()){toast({title:"Aten\u00e7\u00e3o",description:"Preencha nome e e-mail.",variant:"destructive"});return;}
    const{error}=await fc()!.rpc("admin_create_attendant",{p_display_name:newAtt.name,p_email:newAtt.email,p_role:newAtt.role});
    if(error)toast({title:"Erro",description:error.message,variant:"destructive"});
    else{toast({title:"\u2713 Funcion\u00e1rio cadastrado"});setNewAtt({name:"",email:"",role:"attendant"});setShowAdd(false);loadAll();}
  };

  const toggleAttendant=async(a:Attendant)=>{
    if(!fc())return;
    await fc()!.rpc("admin_update_attendant",{p_id:a.id,p_display_name:a.display_name,p_email:a.email,p_role:a.role,p_is_active:!a.is_active});
    loadAll();
  };

  const closeSession=async(id:string)=>{
    if(!fc())return;
    if(!confirm("Finalizar este atendimento?"))return;
    await fc()!.rpc("close_chat_session",{p_session_id:id});
    toast({title:"\u2713 Atendimento encerrado"});
    loadAll();
  };

  const set=(k:string)=>(v:string)=>setSettings(p=>({...p,[k]:v}));
  const price=parseFloat(settings["telefarmacia_price"]||"49.90");
  const commission=parseInt(settings["pharmacist_commission"]||"70");
  const farmValue=price*(commission/100);
  const appValue=price*((100-commission)/100);
  const onlineCount=attendants.filter(a=>a.is_online&&a.is_active).length;
  const waitCount=queue.filter(q=>q.status==="open").length;

  // Chave ausente
  if(missingKey)return(
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0"/>
        <div>
          <p className="font-semibold text-amber-800">Configura\u00e7\u00e3o necess\u00e1ria</p>
          <p className="text-sm text-amber-700 mt-1">Adicione a vari\u00e1vel de ambiente no Vercel:</p>
          <code className="block mt-2 bg-amber-100 text-amber-900 text-xs p-2 rounded">VITE_FARMAPP_SUPABASE_ANON_KEY=eyJ...</code>
          <p className="text-xs text-amber-600 mt-2">Settings \u2192 Environment Variables \u2192 Add \u2192 redeploy</p>
        </div>
      </div>
    </div>
  );

  if(loading&&!Object.keys(settings).length)return(
    <div className="flex items-center justify-center p-12">
      <RefreshCw className="w-6 h-6 animate-spin text-primary"/>
      <span className="ml-3 text-muted-foreground">Carregando dados do FarmApp\u2026</span>
    </div>
  );

  return(
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F5C842] flex items-center justify-center font-black italic text-[#1a237e] text-lg">f</div>
        <div>
          <h2 className="text-xl font-bold">FarmApp \u2014 Painel de Controle</h2>
          <p className="text-sm text-muted-foreground">Teleconsulta \u00b7 Atendentes \u00b7 Chat \u00b7 Configura\u00e7\u00f5es</p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={loadAll}><RefreshCw className="w-4 h-4 mr-2"/>Atualizar</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"Valor consulta",value:`R$ ${price.toFixed(2)}`,color:"text-green-600",icon:<DollarSign className="w-5 h-5"/>},
          {label:"Atendentes online",value:onlineCount,color:"text-blue-600",icon:<UserCheck className="w-5 h-5"/>},
          {label:"Na fila agora",value:waitCount,color:"text-orange-500",icon:<MessageSquare className="w-5 h-5"/>},
          {label:"Total atendentes",value:attendants.filter(a=>a.is_active).length,color:"text-purple-600",icon:<Users className="w-5 h-5"/>},
        ].map(({label,value,color,icon})=>(
          <Card key={label}><CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`${color} opacity-70`}>{icon}</div>
              <div><p className="text-xs text-muted-foreground">{label}</p><p className={`text-xl font-bold ${color}`}>{value}</p></div>
            </div>
          </CardContent></Card>
        ))}
      </div>
      <Tabs defaultValue="pricing">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pricing"><DollarSign className="w-4 h-4 mr-1.5"/>Pre\u00e7os</TabsTrigger>
          <TabsTrigger value="attendants"><Users className="w-4 h-4 mr-1.5"/>Equipe</TabsTrigger>
          <TabsTrigger value="queue"><MessageSquare className="w-4 h-4 mr-1.5"/>Fila ({queue.length})</TabsTrigger>
          <TabsTrigger value="settings"><Settings2 className="w-4 h-4 mr-1.5"/>Config.</TabsTrigger>
        </TabsList>
        <TabsContent value="pricing" className="space-y-4 mt-4">
          <Card><CardHeader><CardTitle>Valor da teleconsulta</CardTitle><CardDescription>Fixado aqui — n\u00e3o pode ser alterado pelo farmac\u00eautico.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Valor cobrado do paciente (R$)</Label><div className="flex gap-2"><Input type="number" step="0.01" min="0" value={settings["telefarmacia_price"]||""} onChange={e=>set("telefarmacia_price")(e.target.value)}/><Button onClick={()=>saveSetting("telefarmacia_price",settings["telefarmacia_price"]||"0")} disabled={saving==="telefarmacia_price"}>{saving==="telefarmacia_price"?<RefreshCw className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}</Button></div></div>
              <div className="space-y-2"><Label>Comiss\u00e3o do farmac\u00eautico (%)</Label><div className="flex gap-2"><Input type="number" step="1" min="0" max="100" value={settings["pharmacist_commission"]||""} onChange={e=>set("pharmacist_commission")(e.target.value)}/><Button onClick={()=>saveSetting("pharmacist_commission",settings["pharmacist_commission"]||"70")} disabled={saving==="pharmacist_commission"}>{saving==="pharmacist_commission"?<RefreshCw className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}</Button></div></div>
            </div>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold">Divis\u00e3o por consulta</p>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Valor total</span><span className="font-bold">R$ {price.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-green-600">\u2192 Farmac\u00eautico ({commission}%)</span><span className="font-bold text-green-600">R$ {farmValue.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm border-t pt-2"><span className="text-blue-600">\u2192 FarmApp ({100-commission}%)</span><span className="font-bold text-blue-600">R$ {appValue.toFixed(2)}</span></div>
            </div>
            <div className="flex items-center justify-between py-3 border rounded-lg px-4">
              <div><p className="font-medium text-sm">Teleconsulta habilitada</p><p className="text-xs text-muted-foreground">Exibe a aba Telef\u00e1rmacia para os pacientes</p></div>
              <Switch checked={settings["teleconsulta_enabled"]==="true"} onCheckedChange={v=>saveSetting("teleconsulta_enabled",String(v))}/>
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="attendants" className="space-y-4 mt-4">
          <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Funcion\u00e1rios do chat</CardTitle><CardDescription>Gerenciam an\u00e1lise de prescri\u00e7\u00f5es</CardDescription></div><Button size="sm" onClick={()=>setShowAdd(v=>!v)}><Plus className="w-4 h-4 mr-1.5"/>Adicionar</Button></CardHeader>
          <CardContent className="space-y-4">
            {showAdd&&(<div className="border rounded-xl p-4 space-y-3 bg-muted/40">
              <p className="font-semibold text-sm">Novo funcion\u00e1rio</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input placeholder="Ana Silva" value={newAtt.name} onChange={e=>setNewAtt(p=>({...p,name:e.target.value}))}/></div>
                <div className="space-y-1"><Label className="text-xs">E-mail *</Label><Input type="email" value={newAtt.email} onChange={e=>setNewAtt(p=>({...p,email:e.target.value}))}/></div>
                <div className="space-y-1"><Label className="text-xs">Cargo</Label><Select value={newAtt.role} onValueChange={v=>setNewAtt(p=>({...p,role:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="attendant">Atendente</SelectItem><SelectItem value="supervisor">Supervisor</SelectItem></SelectContent></Select></div>
              </div>
              <div className="flex gap-2"><Button size="sm" onClick={addAttendant}>Cadastrar</Button><Button size="sm" variant="outline" onClick={()=>setShowAdd(false)}>Cancelar</Button></div>
            </div>)}
            {!attendants.length?<p className="text-center text-muted-foreground py-8">Nenhum funcion\u00e1rio cadastrado ainda.</p>:(
              <div className="space-y-2">{attendants.map(a=>(
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border${!a.is_active?" opacity-50":""}`}>
                  <div className="relative"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{a.display_name[0].toUpperCase()}</div>{a.is_online&&a.is_active&&<span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"/>}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{a.display_name}</p><p className="text-xs text-muted-foreground truncate">{a.email}</p></div>
                  <Badge variant={a.role==="supervisor"?"default":"secondary"}>{a.role==="supervisor"?"Supervisor":"Atendente"}</Badge>
                  <Badge variant={a.is_online?"default":"outline"} className={a.is_online?"bg-green-500":""}>{a.is_online?"Online":"Offline"}</Badge>
                  <Switch checked={a.is_active} onCheckedChange={()=>toggleAttendant(a)}/>
                </div>
              ))}</div>
            )}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="queue" className="space-y-4 mt-4">
          <Card><CardHeader><CardTitle>Fila de atendimento</CardTitle><CardDescription>Ordem FIFO \u2014 paciente com maior espera \u00e9 atendido primeiro</CardDescription></CardHeader>
          <CardContent>{!queue.length?(
            <div className="text-center py-12 text-muted-foreground"><MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30"/><p>Nenhuma sess\u00e3o em aberto</p></div>
          ):(
            <div className="space-y-2">{queue.map((q,i)=>(
              <div key={q.session_id} className={`flex items-center gap-3 p-3 rounded-lg border ${q.status==="open"?"border-amber-300 bg-amber-50":"border-blue-200 bg-blue-50"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${q.status==="open"?"bg-amber-200 text-amber-800":"bg-blue-200 text-blue-800"}`}>{i+1}</div>
                <div className="flex-1 min-w-0"><p className="font-semibold text-sm">{q.patient_name||"Paciente"}</p><p className="text-xs text-muted-foreground truncate">{q.session_title}</p></div>
                <Badge variant={q.status==="open"?"secondary":"default"}>{q.status==="open"?`\u23f3 ${q.wait_minutes}min`:`\uD83D\uDCAC ${q.attendant_name}`}</Badge>
                {q.status==="in_progress"&&<Button size="sm" variant="destructive" onClick={()=>closeSession(q.session_id)}>Finalizar</Button>}
              </div>
            ))}</div>
          )}</CardContent></Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card><CardHeader><CardTitle>Configura\u00e7\u00f5es gerais do FarmApp</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2"><Label>Aviso exibido no app (topo)</Label><Input placeholder="Deixe vazio para n\u00e3o exibir" value={settings["app_notice"]||""} onChange={e=>set("app_notice")(e.target.value)}/></div>
            <div className="space-y-2"><Label>Dom\u00ednio Jitsi</Label><Input value={settings["jitsi_domain"]||"meet.jit.si"} onChange={e=>set("jitsi_domain")(e.target.value)}/></div>
            <div className="space-y-2"><Label>Gateway de pagamento</Label>
              <Select value={settings["payment_gateway"]||"none"} onValueChange={v=>set("payment_gateway")(v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="none">Nenhum</SelectItem><SelectItem value="mercadopago">Mercado Pago</SelectItem><SelectItem value="stripe">Stripe</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between py-3 border rounded-lg px-4">
              <div><p className="font-medium text-sm">Chat de prescri\u00e7\u00e3o habilitado</p></div>
              <Switch checked={settings["attendant_chat_enabled"]!=="false"} onCheckedChange={v=>saveSetting("attendant_chat_enabled",String(v))}/>
            </div>
            <Button onClick={()=>saveMultiple(["app_notice","jitsi_domain","payment_gateway"])} disabled={loading}>
              {loading?<RefreshCw className="w-4 h-4 mr-2 animate-spin"/>:<Save className="w-4 h-4 mr-2"/>}Salvar configura\u00e7\u00f5es
            </Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
