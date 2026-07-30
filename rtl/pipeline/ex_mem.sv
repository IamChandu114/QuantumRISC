`timescale 1ns/1ps

module ex_mem(

input logic clk,
input logic reset,


input logic RegWrite_in,
input logic MemRead_in,
input logic MemWrite_in,
input logic MemtoReg_in,


input logic [31:0] alu_result_in,
input logic [31:0] write_data_in,

input logic [4:0] rd_in,


output logic RegWrite_out,
output logic MemRead_out,
output logic MemWrite_out,
output logic MemtoReg_out,


output logic [31:0] alu_result_out,
output logic [31:0] write_data_out,

output logic [4:0] rd_out


);


always_ff @(posedge clk or posedge reset)

begin

if(reset)

begin

RegWrite_out<=0;
MemRead_out<=0;
MemWrite_out<=0;
MemtoReg_out<=0;

alu_result_out<=0;
write_data_out<=0;
rd_out<=0;

end

else

begin

RegWrite_out<=RegWrite_in;
MemRead_out<=MemRead_in;
MemWrite_out<=MemWrite_in;
MemtoReg_out<=MemtoReg_in;


alu_result_out<=alu_result_in;
write_data_out<=write_data_in;

rd_out<=rd_in;


end


end

endmodule