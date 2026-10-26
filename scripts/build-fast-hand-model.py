#!/usr/bin/env python3
"""Package official MediaPipe Lite networks with the Tasks bundle's tensor metadata.
Development dependencies: flatbuffers, tflite. Never changes model weights or graph tensors.
"""
from pathlib import Path
import io,zipfile,hashlib,json,struct
import flatbuffers,tflite
root=Path(__file__).resolve().parent.parent
source=root/'third_party/mediapipe-lite'
full=zipfile.ZipFile(root/'public/mediapipe/hand_landmarker.task')

def package(lite_path,full_bytes):
    raw=lite_path.read_bytes();lite=tflite.Model.GetRootAsModel(raw,0);reference=tflite.Model.GetRootAsModel(full_bytes,0)
    builder=flatbuffers.Builder(len(raw)+32768)
    # Reuse the unchanged, forward-referenced graph; only the root metadata/buffer vectors are rebuilt.
    builder.Prep(8,len(raw));builder.head-=len(raw);builder.Bytes[builder.head:builder.head+len(raw)]=raw
    end=builder.Offset()
    def old(pos):return end-pos
    def vector(field):
        o=lite._tab.Offset(4+field*2)
        return old(lite._tab.Vector(o)-4) if o else 0
    buffers=[old(lite.Buffers(i)._tab.Pos) for i in range(lite.BuffersLength())]
    metadata=[]
    for i in range(lite.MetadataLength()):
        item=lite.Metadata(i)
        if item.Name()!=b'TFLITE_METADATA':metadata.append((item.Name(),item.Buffer()))
    for i in range(reference.MetadataLength()):
        item=reference.Metadata(i)
        if item.Name()!=b'TFLITE_METADATA':continue
        blob=bytes(reference.Buffers(item.Buffer()).DataAsNumpy())
        data=builder.CreateByteVector(blob);tflite.BufferStart(builder);tflite.BufferAddData(builder,data)
        metadata.append((item.Name(),len(buffers)));buffers.append(tflite.BufferEnd(builder))
    meta_objects=[]
    for name,index in metadata:
        label=builder.CreateString(name);tflite.MetadataStart(builder);tflite.MetadataAddName(builder,label);tflite.MetadataAddBuffer(builder,index);meta_objects.append(tflite.MetadataEnd(builder))
    tflite.ModelStartMetadataVector(builder,len(meta_objects))
    for obj in reversed(meta_objects):builder.PrependUOffsetTRelative(obj)
    meta=builder.EndVector()
    tflite.ModelStartBuffersVector(builder,len(buffers))
    for obj in reversed(buffers):builder.PrependUOffsetTRelative(obj)
    buffer_vector=builder.EndVector()
    tflite.ModelStart(builder);tflite.ModelAddVersion(builder,lite.Version())
    for field,add in [(1,tflite.ModelAddOperatorCodes),(2,tflite.ModelAddSubgraphs),(3,tflite.ModelAddDescription),(7,tflite.ModelAddSignatureDefs)]:
        offset=vector(field) if field!=3 else 0
        if field==3:
            o=lite._tab.Offset(10)
            if o:offset=old(lite._tab.Indirect(lite._tab.Pos+o))
        if offset:add(builder,offset)
    tflite.ModelAddBuffers(builder,buffer_vector);tflite.ModelAddMetadata(builder,meta)
    result=tflite.ModelEnd(builder);builder.Finish(result,file_identifier=b'TFL3');out=bytes(builder.Output())
    verified=tflite.Model.GetRootAsModel(out,0)
    assert verified.SubgraphsLength()==lite.SubgraphsLength() and verified.OperatorCodesLength()==lite.OperatorCodesLength()
    for i in range(lite.BuffersLength()):assert bytes(verified.Buffers(i).DataAsNumpy())==bytes(lite.Buffers(i).DataAsNumpy())
    for i in range(lite.SubgraphsLength()):
        assert verified.Subgraphs(i).OperatorsLength()==lite.Subgraphs(i).OperatorsLength()
        assert verified.Subgraphs(i).TensorsLength()==lite.Subgraphs(i).TensorsLength()
    stream=io.BytesIO(out)
    with zipfile.ZipFile(io.BytesIO(full_bytes)) as associated,zipfile.ZipFile(stream,'a') as target:
        for item in associated.infolist():target.writestr(item,associated.read(item.filename))
    return stream.getvalue()

output=root/'public/mediapipe/hand_landmarker_fast.task'
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_STORED) as bundle:
    for dest,filename in [('hand_detector.tflite','palm_detection_lite.tflite'),('hand_landmarks_detector.tflite','hand_landmark_lite.tflite')]:
        entry=zipfile.ZipInfo(dest)
        padding=(-(bundle.fp.tell()+30+len(dest.encode())+4))%4
        entry.extra=struct.pack('<HH',0xffff,padding)+bytes(padding)
        bundle.writestr(entry,package(source/filename,full.read(dest)))
print(json.dumps({'path':str(output),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}))
