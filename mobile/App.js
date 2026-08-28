import React, {useState} from "react";
import {SafeAreaView, View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, StyleSheet} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {VideoView, useVideoPlayer} from "expo-video";

const API = "http://YOUR_SERVER_IP:8000";

function Player({url}) {
  const player = useVideoPlayer(url, p => { p.loop = true; p.play(); });
  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />;
}

export default function App(){
  const [prompt,setPrompt]=useState("");
  const [ratio,setRatio]=useState("9:16");
  const [resolution,setResolution]=useState("720p");
  const [mode,setMode]=useState("fast");
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState(null);

  async function enhance(){
    if(!prompt.trim()) return Alert.alert("Prompt kosong");
    setBusy(true);
    try{
      const r=await fetch(`${API}/enhance`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
      const d=await r.json();
      if(d.prompt) setPrompt(d.prompt);
    }catch(e){Alert.alert("Gagal",String(e))}
    finally{setBusy(false)}
  }

  async function generate(){
    if(!prompt.trim()) return Alert.alert("Tulis prompt dulu");
    setBusy(true); setResult(null);
    try{
      const r=await fetch(`${API}/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,aspect_ratio:ratio,resolution,mode})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.detail || "Generation gagal");
      setResult(`${API}${d.url}`);
    }catch(e){Alert.alert("AI Error",String(e))}
    finally{setBusy(false)}
  }

  async function pickImage(){
    const x=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:1});
    if(!x.canceled) Alert.alert("Image-to-video", "Upload endpoint siap. Kita sambungkan image input pada tahap berikutnya.");
  }

  return <SafeAreaView style={styles.root}>
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.logo}>CLIPFLOW <Text style={styles.ai}>AI</Text></Text>
      <Text style={styles.sub}>AI filmmaking studio</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Describe your scene</Text>
        <TextInput value={prompt} onChangeText={setPrompt} multiline placeholder="Contoh: cinematic drone shot over a futuristic city at sunset..." placeholderTextColor="#777" style={styles.input}/>
        <Pressable style={styles.secondary} onPress={enhance}><Text style={styles.btnText}>✨ Enhance Prompt</Text></Pressable>
      </View>

      <View style={styles.row}>
        {["9:16","16:9"].map(x=><Pressable key={x} onPress={()=>setRatio(x)} style={[styles.chip,ratio===x&&styles.active]}><Text style={styles.chipText}>{x}</Text></Pressable>)}
        {["720p","1080p"].map(x=><Pressable key={x} onPress={()=>setResolution(x)} style={[styles.chip,resolution===x&&styles.active]}><Text style={styles.chipText}>{x}</Text></Pressable>)}
      </View>

      <View style={styles.row}>
        <Pressable onPress={()=>setMode("fast")} style={[styles.mode,mode==="fast"&&styles.active]}><Text style={styles.chipText}>⚡ Fast</Text></Pressable>
        <Pressable onPress={()=>setMode("quality")} style={[styles.mode,mode==="quality"&&styles.active]}><Text style={styles.chipText}>🎬 Quality</Text></Pressable>
      </View>

      <View style={styles.row}>
        <Pressable style={styles.secondaryHalf} onPress={pickImage}><Text style={styles.btnText}>🖼 Image</Text></Pressable>
        <Pressable style={styles.generate} onPress={generate} disabled={busy}>
          {busy?<ActivityIndicator color="#fff"/>:<Text style={styles.generateText}>Generate Video</Text>}
        </Pressable>
      </View>

      {result && <View style={styles.card}><Text style={styles.label}>Result</Text><Player url={result}/></View>}

      <Text style={styles.note}>API key tetap di backend — jangan taruh API key di APK.</Text>
    </ScrollView>
  </SafeAreaView>
}

const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:"#09090b"},wrap:{padding:20,gap:14},
 logo:{fontSize:30,fontWeight:"900",color:"#fff",marginTop:18},ai:{color:"#a78bfa"},sub:{color:"#8b8b95",marginBottom:8},
 card:{backgroundColor:"#15151a",borderRadius:22,padding:16,gap:12},label:{color:"#ddd",fontWeight:"700"},
 input:{minHeight:150,color:"#fff",fontSize:16,textAlignVertical:"top",backgroundColor:"#0d0d10",borderRadius:15,padding:14},
 row:{flexDirection:"row",gap:8,flexWrap:"wrap"},chip:{paddingVertical:10,paddingHorizontal:14,borderRadius:999,backgroundColor:"#17171d"},active:{backgroundColor:"#6d4aff"},
 chipText:{color:"#fff",fontWeight:"700"},secondary:{backgroundColor:"#24242b",padding:13,borderRadius:13,alignItems:"center"},
 secondaryHalf:{flex:1,backgroundColor:"#24242b",padding:15,borderRadius:14,alignItems:"center"},
 mode:{flex:1,padding:13,borderRadius:14,backgroundColor:"#17171d",alignItems:"center"},
 generate:{flex:2,backgroundColor:"#7c5cff",padding:15,borderRadius:14,alignItems:"center"},
 generateText:{color:"#fff",fontWeight:"900"},btnText:{color:"#fff",fontWeight:"700"},
 video:{width:"100%",height:400,borderRadius:16},note:{color:"#666",fontSize:12,textAlign:"center",marginTop:10}
});
