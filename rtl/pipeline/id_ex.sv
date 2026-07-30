`timescale 1ns/1ps

module id_ex(

input logic clk,
input logic reset,


input logic RegWrite_in,
input logic MemRead_in,
input logic MemWrite_in,
input logic MemtoReg_in,
input logic ALUSrc_in,

input logic [31:0] pc_in,

input logic [31:0] read_data1_in,
input logic [31:0] read_data2_in,

input logic [31:0] immediate_in,

input logic [4:0] rd_in,
input logic [2:0] funct3_in,
input logic [6:0] funct7_in,


output logic RegWrite_out,
output logic MemRead_out,
output logic MemWrite_out,
output logic MemtoReg_out,
output logic ALUSrc_out,


output logic [31:0] pc_out,

output logic [31:0] read_data1_out,
output logic [31:0] read_data2_out,

output logic [31:0] immediate_out,

output logic [4:0] rd_out,
output logic [2:0] funct3_out,
output logic [6:0] funct7_out


);


always_ff @(posedge clk or posedge reset)

begin

if(reset)

begin

RegWrite_out <=0;
MemRead_out<=0;
MemWrite_out<=0;
MemtoReg_out<=0;
ALUSrc_out<=0;

pc_out<=0;
read_data1_out<=0;
read_data2_out<=0;
immediate_out<=0;

rd_out<=0;
funct3_out<=0;
funct7_out<=0;

end


else

begin

RegWrite_out<=RegWrite_in;
MemRead_out<=MemRead_in;
MemWrite_out<=MemWrite_in;
MemtoReg_out<=MemtoReg_in;
ALUSrc_out<=ALUSrc_in;

pc_out<=pc_in;

read_data1_out<=read_data1_in;
read_data2_out<=read_data2_in;

immediate_out<=immediate_in;

rd_out<=rd_in;
funct3_out<=funct3_in;
funct7_out<=funct7_in;


end

end


endmodule